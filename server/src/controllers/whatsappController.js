import { pool } from '../config/db.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notFound } from '../utils/AppError.js';
import { buildBookingMessage } from '../utils/bookingMessage.js';
import { toE164 } from '../utils/phone.js';
import { getBookingById } from '../services/bookingService.js';
import * as wa from '../services/whatsappService.js';

export const status = asyncHandler(async (_req, res) => {
  const recipients = await wa.getBusinessRecipients();
  res.json({ data: {
    configured: wa.isWhatsAppConfigured(),
    mode: wa.whatsappMode(),
    templateName: config.whatsapp.templateName || null,
    apiVersion: config.whatsapp.apiVersion,
    recipients: recipients.map((r) => (r.number ? toE164(r.number) : `${r.input} (invalid)`)),
  } });
});

export const test = asyncHandler(async (_req, res) => res.json({ data: await wa.sendTestMessage() }));

export const sendBooking = asyncHandler(async (req, res) => {
  const result = await wa.resendBookingNotification(req.params.id);
  if (!result) throw notFound('Booking not found');
  res.json({ data: result });
});

/** The identical message + manual wa.me links (works even without Cloud API credentials). */
export const bookingLinks = asyncHandler(async (req, res) => {
  const booking = await getBookingById(req.params.id);
  if (!booking) throw notFound('Booking not found');
  const message = buildBookingMessage(booking, config.countryCode);
  res.json({ data: { message, links: await wa.buildFallbackLinks(message) } });
});

export const logs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const where = [];
  const params = [];
  if (['SENT', 'FAILED', 'SKIPPED'].includes(req.query.status)) { where.push('status = ?'); params.push(req.query.status); }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM whatsapp_logs ${w}`, params);
  const [rows] = await pool.query(`SELECT * FROM whatsapp_logs ${w} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, (page - 1) * limit]);
  res.json({ data: rows, meta: { total, page, limit } });
});

export const retry = asyncHandler(async (req, res) => {
  const result = await wa.retryLog(req.params.id);
  if (!result) throw notFound('Log entry not found');
  res.json({ data: result });
});
