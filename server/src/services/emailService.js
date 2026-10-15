import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const enabled = () => Boolean(config.smtp.host && config.smtp.notifyTo.length);
let transporter;

/** Optional email notification. Silently skipped when SMTP_HOST / NOTIFY_EMAIL_TO are not set. */
export async function sendNotificationEmail(subject, text) {
  if (!enabled()) return { sent: false, reason: 'SMTP not configured' };
  try {
    transporter ||= nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
    await transporter.sendMail({ from: config.smtp.from, to: config.smtp.notifyTo, subject, text });
    return { sent: true };
  } catch (err) {
    console.error('[email] failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Sends a structured admin booking notice after persistence; failures never affect the saved booking. */
export async function sendBookingAdminEmail(booking) {
  if (!enabled()) return { sent: false, reason: 'SMTP not configured' };
  const rows = [
    ['Reference', booking.reference], ['Status', booking.status], ['Customer', booking.customer_name],
    ['Phone', booking.customer_phone], ['Email', booking.customer_email], ['Pickup', booking.pickup_location],
    ['Destination', booking.destination], ['Requested date', booking.pickup_date], ['Requested time', booking.pickup_time],
    ['Service', booking.service_name], ['Passengers', booking.passengers], ['Created', booking.created_at],
  ].filter(([, value]) => value != null && value !== '');
  const htmlRows = rows.map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`).join('');
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  try {
    transporter ||= nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
    await transporter.sendMail({
      from: config.smtp.from,
      to: config.smtp.notifyTo,
      subject: `New booking ${booking.reference}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;color:#17251c"><h1 style="font-size:22px">New Secure Eco Ride booking</h1><table style="border-collapse:collapse;width:100%;max-width:640px">${htmlRows}</table><p style="color:#667085;font-size:12px">This notification was sent after the booking was saved.</p></div>`,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email booking ${booking.reference}] failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

function statusEmailContent(booking, previousStatus) {
  const status = String(booking.status || '').replaceAll('_', ' ').toLowerCase();
  const previous = String(previousStatus || '').replaceAll('_', ' ').toLowerCase();
  const rows = [
    ['Booking reference', booking.reference], ['Previous status', previous], ['New status', status],
    ['Pickup', booking.pickup_location], ['Destination', booking.destination],
    ['Date', booking.pickup_date], ['Time', String(booking.pickup_time || '').slice(0, 5)],
    ['Service', booking.service_name],
    ['Assigned driver', booking.driver_name], ['Driver phone', booking.driver_phone],
    ['Vehicle', booking.vehicle_name], ['Vehicle registration', booking.vehicle_plate],
  ].filter(([, value]) => value != null && value !== '');
  const htmlRows = rows.map(([label, value]) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`).join('');
  return { status, previous, rows, htmlRows };
}

/** Emails the customer after any real booking status transition. */
export async function sendCustomerBookingStatusEmail(booking, previousStatus) {
  if (!booking.customer_email) return { sent: false, reason: 'Customer email not provided' };
  if (!config.smtp.host) return { sent: false, reason: 'SMTP not configured' };
  const { status, previous, rows, htmlRows } = statusEmailContent(booking, previousStatus);
  const text = [
    `Hello ${booking.customer_name},`, '',
    `The status of your Secure Eco Ride booking ${booking.reference} changed from ${previous} to ${status}.`, '',
    ...rows.map(([label, value]) => `${label}: ${value}`), '',
    'Our team will contact you if any further details are needed.',
    'Thank you for choosing Secure Eco Ride.',
  ].join('\n');
  try {
    transporter ||= nodemailer.createTransport({
      host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
    await transporter.sendMail({
      from: config.smtp.from,
      to: booking.customer_email,
      subject: `Booking ${status} — ${booking.reference}`,
      text,
      html: `<div style="font-family:Arial,sans-serif;color:#17251c;max-width:640px"><h1 style="font-size:22px">Booking status updated</h1><p>Hello ${escapeHtml(booking.customer_name)},</p><p>Your Secure Eco Ride booking <strong>${escapeHtml(booking.reference)}</strong> changed from <strong>${escapeHtml(previous)}</strong> to <strong>${escapeHtml(status)}</strong>.</p><table style="border-collapse:collapse;width:100%">${htmlRows}</table><p>Our team will contact you if any further details are needed.</p><p>Thank you for choosing Secure Eco Ride.</p></div>`,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email booking ${booking.reference}] customer confirmation failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

/** Sends an independent status notice to the configured admin recipients. */
export async function sendAdminBookingStatusEmail(booking, previousStatus) {
  if (!enabled()) return { sent: false, reason: 'Admin email not configured' };
  const { status, previous, rows, htmlRows } = statusEmailContent(booking, previousStatus);
  try {
    transporter ||= nodemailer.createTransport({
      host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
    await transporter.sendMail({
      from: config.smtp.from,
      to: config.smtp.notifyTo,
      subject: `Booking ${status} — ${booking.reference}`,
      text: [`Booking ${booking.reference} status changed from ${previous} to ${status}.`, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;color:#17251c"><h1 style="font-size:22px">Booking status changed</h1><table style="border-collapse:collapse;width:100%;max-width:640px">${htmlRows}</table></div>`,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email booking ${booking.reference}] admin status notice failed:`, err.message);
    return { sent: false, reason: err.message };
  }
}

export async function sendTestEmail() {
  if (!enabled()) return { sent: false, reason: 'Set SMTP_HOST and ADMIN_NOTIFICATION_EMAIL first.' };
  try {
    transporter ||= nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure, auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined });
    await transporter.sendMail({
      from: config.smtp.from, to: config.smtp.notifyTo,
      subject: 'Secure Eco Ride SMTP test',
      text: 'This is a test email from Secure Eco Ride. SMTP is configured to deliver booking notifications.',
      html: '<p>This is a test email from <strong>Secure Eco Ride</strong>. SMTP is configured to deliver booking notifications.</p>',
    });
    return { sent: true };
  } catch (err) {
    console.error('[email] test failed:', err.message);
    return { sent: false, reason: 'SMTP delivery failed. Check the server log and SMTP configuration.' };
  }
}
