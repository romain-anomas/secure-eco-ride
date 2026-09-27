import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/AppError.js';
import * as bookings from '../services/bookingService.js';
import { sendBookingNotification } from '../services/whatsappService.js';
import { sendNotificationEmail } from '../services/emailService.js';

const CUSTOMER_MESSAGE = 'Your booking has been received. Our team will contact you shortly.';

export const createBooking = asyncHandler(async (req, res) => {
  // Honeypot: pretend success so bots learn nothing
  if (req.body.website) return res.status(201).json({ data: { reference: 'SER-RECEIVED', message: CUSTOMER_MESSAGE } });

  const booking = await bookings.createBooking(req.body);

  // The booking is already saved. Notification problems must never undo it or reach the customer as an error.
  let fallbackLinks = [];
  try {
    const notification = await sendBookingNotification(booking);
    fallbackLinks = notification.fallbackLinks;
    sendNotificationEmail(`New booking ${booking.reference}`, notification.message).catch(() => {});
  } catch (err) {
    console.error(`[booking ${booking.reference}] notification failed:`, err);
  }

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
      // Only present when WhatsApp Cloud API is not configured (development fallback).
      whatsappFallback: fallbackLinks.length ? { requiresManualSend: true, links: fallbackLinks } : null,
    },
  });
});

export const listBookings = asyncHandler(async (req, res) => {
  const { rows, total } = await bookings.listBookings(req.query);
  res.json({ data: rows, meta: { total, page: req.query.page, limit: req.query.limit } });
});

export const unseenCount = asyncHandler(async (_req, res) => {
  const [[row]] = await pool.query(`SELECT COUNT(*) AS count, MAX(created_at) AS latest FROM bookings WHERE seen_by_admin = 0`);
  res.json({ data: row });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookings.getBookingById(req.params.id);
  if (!booking) throw notFound('Booking not found');
  if (!booking.seen_by_admin) {
    await pool.query('UPDATE bookings SET seen_by_admin = 1 WHERE id = ?', [booking.id]);
    booking.seen_by_admin = 1;
  }
  const history = await bookings.getStatusHistory(booking.id);
  const [logs] = await pool.query('SELECT id, recipient, status, error, attempts, created_at FROM whatsapp_logs WHERE booking_id = ? ORDER BY id DESC', [booking.id]);
  res.json({ data: { ...booking, history, whatsapp_logs: logs } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json({ data: await bookings.changeStatus(req.params.id, req.body.status, req.user.id, req.body.note) });
});

export const assignDriver = asyncHandler(async (req, res) => {
  res.json({ data: await bookings.assignDriver(req.params.id, req.body, req.user.id) });
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
