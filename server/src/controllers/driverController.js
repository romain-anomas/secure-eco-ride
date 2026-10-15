import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound } from '../utils/AppError.js';

const ACTIVE = ['ASSIGNED', 'DRIVER_ON_WAY', 'PICKED_UP'];

export const createAccount = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const existing = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing[0].length) throw badRequest('An account already uses this email address.');
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  let account;
  try {
    account = await withTransaction(async (conn) => {
      const [[driver]] = await conn.query('SELECT id, name, is_active, user_id FROM drivers WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!driver) throw notFound('Driver not found.');
      if (!driver.is_active) throw badRequest('Activate this driver before creating an account.');
      if (driver.user_id) throw badRequest('This driver already has an account.');
      const [created] = await conn.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, \'DRIVER\')', [driver.name, email, passwordHash]);
      await conn.query('UPDATE drivers SET user_id = ? WHERE id = ?', [created.insertId, driver.id]);
      return { id: created.insertId, name: driver.name, email, role: 'DRIVER' };
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw badRequest('This email or driver account is already in use.');
    throw err;
  }
  res.status(201).json({ data: account });
});

export const updateAccount = asyncHandler(async (req, res) => {
  const [[driver]] = await pool.query('SELECT user_id FROM drivers WHERE id = ?', [req.params.id]);
  if (!driver) throw notFound('Driver not found.');
  if (!driver.user_id) throw badRequest('Create a login for this driver before editing account settings.');

  const fields = [];
  const values = [];
  const email = req.body.email?.toLowerCase();
  if (email) {
    const [[duplicate]] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, driver.user_id]);
    if (duplicate) throw badRequest('Another account already uses this email address.');
    fields.push('email = ?');
    values.push(email);
  }
  if (req.body.password) {
    fields.push('password_hash = ?');
    values.push(await bcrypt.hash(req.body.password, 12));
  }
  if (req.body.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(Number(req.body.is_active));
  }
  try {
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ? AND role = 'DRIVER'`, [...values, driver.user_id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw badRequest('Another account already uses this email address.');
    throw err;
  }
  const [[account]] = await pool.query('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [driver.user_id]);
  res.json({ data: account });
});

export const assignedBookings = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.id, b.reference, b.status, b.pickup_date, b.pickup_time, b.pickup_location, b.destination,
      b.pickup_latitude, b.pickup_longitude, b.destination_latitude, b.destination_longitude,
      b.passengers, b.vehicle_type, b.notes, b.flight_number, b.airport_direction, b.airport_name,
      c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
      v.name AS vehicle_name, v.model AS vehicle_model, v.plate_number AS vehicle_plate
     FROM bookings b JOIN customers c ON c.id = b.customer_id
     LEFT JOIN vehicles v ON v.id = b.vehicle_id
     WHERE b.driver_id = ? ORDER BY b.pickup_date DESC, b.pickup_time DESC LIMIT 200`, [req.user.driver_id]);
  const [[driver]] = await pool.query('SELECT status FROM drivers WHERE id = ? AND is_active = 1', [req.user.driver_id]);
  res.json({ data: rows, meta: { availability: driver?.status || 'OFFLINE' } });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const driverId = req.user.driver_id;
  if (!driverId) throw notFound('Driver account is not linked to a driver.');
  const status = await withTransaction(async (conn) => {
    const [[driver]] = await conn.query('SELECT id, is_active FROM drivers WHERE id = ? FOR UPDATE', [driverId]);
    if (!driver || !driver.is_active) throw notFound('Active driver profile not found.');
    const [[{ count }]] = await conn.query(`SELECT COUNT(*) AS count FROM bookings WHERE driver_id = ? AND status IN (${ACTIVE.map(() => '?').join(',')})`, [driverId, ...ACTIVE]);
    const next = count ? 'BUSY' : (req.body.available ? 'AVAILABLE' : 'OFFLINE');
    await conn.query('UPDATE drivers SET status = ? WHERE id = ?', [next, driverId]);
    return next;
  });
  res.json({ data: { status, available: status === 'AVAILABLE' } });
});
