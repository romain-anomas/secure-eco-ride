import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden } from '../utils/AppError.js';
import { normalizePhone } from '../utils/phone.js';
import { todayInTz } from '../utils/dates.js';
import { getAllSettings, updateSettings, PUBLIC_SETTING_KEYS } from '../services/settingsService.js';
import { sendContactNotification } from '../services/whatsappService.js';
import { sendNotificationEmail } from '../services/emailService.js';
import { uploadsPublicPath } from '../middleware/upload.js';
import { Pricing } from '../models/resources.js';

// ------------------------------------------------------------- settings
export const publicSettings = asyncHandler(async (_req, res) => {
  const all = await getAllSettings();
  res.json({ data: Object.fromEntries(PUBLIC_SETTING_KEYS.map((k) => [k, all[k]])) });
});
export const adminSettings = asyncHandler(async (_req, res) => res.json({ data: await getAllSettings() }));
export const saveSettings = asyncHandler(async (req, res) => res.json({ data: await updateSettings(req.body) }));

// -------------------------------------------------------------- uploads
export const uploadImage = (req, res) => {
  if (!req.file) throw badRequest('Choose an image to upload.');
  res.status(201).json({ data: { url: uploadsPublicPath(req.file.filename) } });
};

// ------------------------------------------------------------- customers
export const listCustomers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
  const [rows] = await pool.query(
    `SELECT c.*, COUNT(b.id) AS booking_count, MAX(b.created_at) AS last_booking_at
     FROM customers c LEFT JOIN bookings b ON b.customer_id = c.id
     ${q ? 'WHERE c.name LIKE ? OR c.phone LIKE ?' : ''}
     GROUP BY c.id ORDER BY last_booking_at DESC, c.id DESC LIMIT 500`,
    q ? [like, like] : [],
  );
  res.json({ data: rows });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const cols = Object.keys(req.body).filter((k) => req.body[k] !== undefined);
  if (cols.length) {
    await pool.query(`UPDATE customers SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...cols.map((c) => (typeof req.body[c] === 'boolean' ? Number(req.body[c]) : req.body[c])), req.params.id]);
  }
  const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
  res.json({ data: rows[0] });
});

// ------------------------------------------------------- contact messages
export const createContact = asyncHandler(async (req, res) => {
  const d = req.body;
  const reply = { data: { message: d.type === 'CORPORATE' ? 'Thank you. Our team will contact you about corporate travel shortly.' : 'Thank you. Your message has been received.' } };
  if (d.website) return res.status(201).json(reply);

  const phone = d.phone ? normalizePhone(d.phone, config.countryCode) : null;
  const [r] = await pool.query(
    'INSERT INTO contact_messages (type, name, company, phone, email, message) VALUES (?,?,?,?,?,?)',
    [d.type, d.name, d.company || null, phone, d.email || null, d.message],
  );
  const contact = { id: r.insertId, ...d, phone };
  sendContactNotification(contact).catch((e) => console.error('[contact] whatsapp notification failed:', e.message));
  sendNotificationEmail(`New ${d.type.toLowerCase()} message from ${d.name}`, d.message).catch(() => {});
  res.status(201).json(reply);
});

export const listContacts = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500');
  res.json({ data: rows });
});
export const updateContact = asyncHandler(async (req, res) => {
  await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ data: { updated: true } });
});
export const deleteContact = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ data: { deleted: true } });
});

// -------------------------------------------------------------- pricing
export const publicPricing = asyncHandler(async (_req, res) => {
  const settings = await getAllSettings();
  if (!settings.show_prices) return res.json({ data: [] }); // quotation-based unless the admin opts in
  const rows = await Pricing.list('WHERE t.is_active = 1');
  res.json({ data: rows.map(({ id, service_id, name, base_price, price_per_km, minimum_price, additional_fees, currency, notes }) => ({ id, service_id, name, base_price, price_per_km, minimum_price, additional_fees, currency, notes })) });
});

// ---------------------------------------------------------------- users
export const listUsers = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, is_active, last_login_at, created_at FROM users ORDER BY id ASC');
  res.json({ data: rows });
});
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, is_active } = req.body;
  const [r] = await pool.query('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?,?,?,?,?)',
    [name, email.toLowerCase(), await bcrypt.hash(password, 12), role, is_active === false ? 0 : 1]);
  res.status(201).json({ data: { id: r.insertId, name, email, role } });
});
export const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { password, ...rest } = req.body;
  if (id === req.user.id && (rest.role === 'STAFF' || rest.is_active === false)) throw forbidden('You cannot demote or deactivate your own account.');
  const cols = [];
  const vals = [];
  for (const [k, v] of Object.entries(rest)) if (v !== undefined) { cols.push(`${k} = ?`); vals.push(k === 'email' ? v.toLowerCase() : typeof v === 'boolean' ? Number(v) : v); }
  if (password) { cols.push('password_hash = ?'); vals.push(await bcrypt.hash(password, 12)); }
  if (cols.length) await pool.query(`UPDATE users SET ${cols.join(', ')} WHERE id = ?`, [...vals, id]);
  res.json({ data: { updated: true } });
});
export const deleteUser = asyncHandler(async (req, res) => {
  if (Number(req.params.id) === req.user.id) throw forbidden('You cannot delete your own account.');
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ data: { deleted: true } });
});

// ------------------------------------------------------ dashboard / reports
export const dashboardSummary = asyncHandler(async (_req, res) => {
  const today = todayInTz(config.timezone);
  const one = async (sql, p = []) => (await pool.query(sql, p))[0][0];
  const [today_row, status_rows, customers, drivers, vehicles, unseen, wa_failed, messages_new] = await Promise.all([
    one('SELECT COUNT(*) AS n FROM bookings WHERE pickup_date = ?', [today]),
    pool.query('SELECT status, COUNT(*) AS n FROM bookings GROUP BY status').then(([r]) => r),
    one('SELECT COUNT(*) AS n FROM customers'),
    one(`SELECT COUNT(*) AS n FROM drivers WHERE is_active = 1 AND status <> 'OFFLINE'`),
    one(`SELECT COUNT(*) AS n FROM vehicles WHERE status = 'AVAILABLE'`),
    one('SELECT COUNT(*) AS n FROM bookings WHERE seen_by_admin = 0'),
    one(`SELECT COUNT(*) AS n FROM whatsapp_logs WHERE status = 'FAILED' AND created_at >= NOW() - INTERVAL 7 DAY`),
    one(`SELECT COUNT(*) AS n FROM contact_messages WHERE status = 'NEW'`),
  ]);
  const byStatus = Object.fromEntries(status_rows.map((r) => [r.status, r.n]));
  res.json({ data: {
    today: today_row.n,
    pending: byStatus.PENDING || 0,
    confirmed: byStatus.CONFIRMED || 0,
    completed: byStatus.COMPLETED || 0,
    cancelled: byStatus.CANCELLED || 0,
    by_status: byStatus,
    customers: customers.n,
    active_drivers: drivers.n,
    available_vehicles: vehicles.n,
    unseen_bookings: unseen.n,
    whatsapp_failed_7d: wa_failed.n,
    new_messages: messages_new.n,
  } });
});

export const reports = asyncHandler(async (req, res) => {
  const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '') ? req.query.to : todayInTz(config.timezone);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '')
    ? req.query.from
    : new Date(new Date(`${to}T00:00:00Z`).getTime() - 29 * 86400000).toISOString().slice(0, 10);

  const [perDay] = await pool.query('SELECT pickup_date AS day, COUNT(*) AS bookings FROM bookings WHERE pickup_date BETWEEN ? AND ? GROUP BY pickup_date ORDER BY pickup_date', [from, to]);
  const [perService] = await pool.query('SELECT service_name AS label, COUNT(*) AS value FROM bookings WHERE pickup_date BETWEEN ? AND ? GROUP BY service_name ORDER BY value DESC', [from, to]);
  const [perStatus] = await pool.query('SELECT status AS label, COUNT(*) AS value FROM bookings WHERE pickup_date BETWEEN ? AND ? GROUP BY status', [from, to]);
  const [[totals]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(status = 'COMPLETED') AS completed, SUM(status = 'CANCELLED') AS cancelled,
            COUNT(DISTINCT customer_id) AS unique_customers, SUM(CASE WHEN status = 'COMPLETED' THEN quoted_price END) AS quoted_revenue
     FROM bookings WHERE pickup_date BETWEEN ? AND ?`, [from, to]);
  const [topRoutes] = await pool.query(
    'SELECT pickup_location, destination, COUNT(*) AS trips FROM bookings WHERE pickup_date BETWEEN ? AND ? GROUP BY pickup_location, destination ORDER BY trips DESC LIMIT 5', [from, to]);
  res.json({ data: { from, to, per_day: perDay, per_service: perService, per_status: perStatus, totals: { ...totals, completed: Number(totals.completed || 0), cancelled: Number(totals.cancelled || 0) }, top_routes: topRoutes } });
});
