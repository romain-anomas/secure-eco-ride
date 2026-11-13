import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/AppError.js';
import * as bookings from '../services/bookingService.js';
import { sendAdminBookingStatusEmail, sendBookingAdminEmail, sendCustomerBookingReceivedEmail, sendCustomerBookingStatusEmail, sendTestEmail } from '../services/emailService.js';
import { sendBookingPush, sendDriverAssignmentPush } from '../services/pushService.js';

const CUSTOMER_MESSAGE = 'Your booking has been received. Our team will contact you shortly.';

function sendStatusEmailsInBackground(booking, previousStatus, action) {
  Promise.all([
    sendCustomerBookingStatusEmail(booking, previousStatus),
    sendAdminBookingStatusEmail(booking, previousStatus),
  ]).then(([customerResult, adminResult]) => {
    if (!customerResult.sent) console.error(`[booking ${booking.reference}] customer ${action} email not sent: ${customerResult.reason}`);
    if (!adminResult.sent) console.error(`[booking ${booking.reference}] admin ${action} email not sent: ${adminResult.reason}`);
  }).catch((err) => {
    console.error(`[booking ${booking.reference}] ${action} email dispatch failed:`, err.message);
  });
}

export const createBooking = asyncHandler(async (req, res) => {
  // Honeypot: pretend success so bots learn nothing
  if (req.body.website) return res.status(201).json({ data: { reference: 'SER-RECEIVED', message: CUSTOMER_MESSAGE } });

  const { booking, created } = await bookings.createBooking(req.body);
  if (!created) {
    return res.status(200).json({ data: { reference: booking.reference, status: booking.status, message: CUSTOMER_MESSAGE } });
  }
  sendBookingPush(booking).catch((err) => console.error(`[booking ${booking.reference}] push dispatch failed code=${err.code || 'unknown_error'}`));

  // The booking is already saved. Notification problems must never undo it or reach the customer as an error.
  sendBookingAdminEmail(booking).then((result) => {
    if (!result.sent) console.error(`[booking ${booking.reference}] admin receipt email not sent: ${result.reason}`);
  }).catch((err) => console.error(`[booking ${booking.reference}] admin receipt email failed:`, err.message));
  sendCustomerBookingReceivedEmail(booking).then((result) => {
    if (!result.sent) console.error(`[booking ${booking.reference}] customer receipt email not sent: ${result.reason}`);
  }).catch((err) => console.error(`[booking ${booking.reference}] customer receipt email failed:`, err.message));

  res.status(201).json({
    data: {
      reference: booking.reference,
      status: booking.status,
      message: CUSTOMER_MESSAGE,
      summary: {
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        pickup_date: booking.pickup_date,
        pickup_time: booking.pickup_time.slice(0, 5),
        passengers: booking.passengers,
        service_name: booking.service_name,
      },
    },
  });
});

export const listBookings = asyncHandler(async (req, res) => {
  const { rows, total } = await bookings.listBookings(req.query);
  res.json({ data: rows, meta: { total, page: req.query.page, limit: req.query.limit } });
});

export const unseenCount = asyncHandler(async (_req, res) => {
  const [[summary]] = await pool.query(`SELECT COUNT(*) AS count, MAX(created_at) AS latest FROM bookings WHERE seen_by_admin = 0`);
  const [rows] = await pool.query('SELECT id FROM bookings WHERE seen_by_admin = 0 ORDER BY id DESC LIMIT 100');
  res.json({ data: { ...summary, booking_ids: rows.map((row) => String(row.id)) } });
});

export const testEmail = asyncHandler(async (_req, res) => {
  const result = await sendTestEmail();
  res.status(result.sent ? 200 : 503).json({ data: result });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookings.getBookingForAdminAction(req.params.id);
  if (!booking) throw notFound('Booking not found');
  if (!booking.seen_by_admin) {
    await pool.query('UPDATE bookings SET seen_by_admin = 1 WHERE id = ?', [booking.id]);
    booking.seen_by_admin = 1;
  }
  res.json({ data: booking });
});

export const sendBookingUpdate = asyncHandler(async (req, res) => {
  const { booking, previousStatus, notificationEventId } = await bookings.dispatchBookingUpdate(req.params.id, req.body, req.user.id);
  if (notificationEventId) {
    sendDriverAssignmentPush(booking, notificationEventId)
      .catch((err) => console.error(`[booking ${booking.reference}] driver push dispatch failed code=${err.code || 'unknown_error'}`));
  }
  sendStatusEmailsInBackground(booking, previousStatus, 'status update');
  res.json({ data: booking, meta: { status_emails: { customer: 'QUEUED', admin: 'QUEUED' } } });
});

export const decideBooking = asyncHandler(async (req, res) => {
  const { booking, previousStatus } = await bookings.decideBooking(req.params.id, req.body.decision, req.user.id);
  sendStatusEmailsInBackground(booking, previousStatus, 'decision');
  res.json({ data: booking, meta: { status_emails: { customer: 'QUEUED', admin: 'QUEUED' } } });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const fields = [];
  const params = [];
  for (const k of ['admin_notes', 'quoted_price']) {
    if (req.body[k] !== undefined) { fields.push(`${k} = ?`); params.push(req.body[k]); }
  }
  if (fields.length) await pool.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, [...params, req.params.id]);
  const booking = await bookings.getBookingById(req.params.id);
  if (!booking) throw notFound('Booking not found');
  res.json({ data: booking });
});
