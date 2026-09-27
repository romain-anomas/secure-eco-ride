import { pool, withTransaction } from '../config/db.js';
import { config } from '../config/env.js';
import { yearInTz } from '../utils/dates.js';
import { normalizePhone } from '../utils/phone.js';
import { badRequest } from '../utils/AppError.js';

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'DRIVER_ON_WAY', 'PICKED_UP', 'COMPLETED', 'CANCELLED'];
const ACTIVE_DRIVER_STATUSES = ['ASSIGNED', 'DRIVER_ON_WAY', 'PICKED_UP'];

const BOOKING_SELECT = `
  SELECT b.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
         d.name AS driver_name, d.phone AS driver_phone,
         v.name AS vehicle_name, v.plate_number AS vehicle_plate,
         (SELECT COUNT(*) FROM whatsapp_logs w WHERE w.booking_id = b.id AND w.status = 'SENT')    AS wa_sent,
         (SELECT COUNT(*) FROM whatsapp_logs w WHERE w.booking_id = b.id AND w.status = 'FAILED')  AS wa_failed,
         (SELECT COUNT(*) FROM whatsapp_logs w WHERE w.booking_id = b.id AND w.status = 'SKIPPED') AS wa_skipped
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  LEFT JOIN drivers d  ON d.id = b.driver_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id`;

function withWhatsAppSummary(row) {
  if (!row) return row;
  const { wa_sent: sent, wa_failed: failed, wa_skipped: skipped, ...rest } = row;
  let whatsapp_status = 'NONE';
  if (failed && sent) whatsapp_status = 'PARTIAL';
  else if (failed) whatsapp_status = 'FAILED';
  else if (skipped && !sent) whatsapp_status = 'NOT_SENT';
  else if (sent) whatsapp_status = 'SENT';
  return { ...rest, whatsapp_status, whatsapp_counts: { sent, failed, skipped } };
}

export async function getBookingById(id) {
  const [rows] = await pool.query(`${BOOKING_SELECT} WHERE b.id = ?`, [id]);
  return withWhatsAppSummary(rows[0]);
}

export async function listBookings({ status, date_from, date_to, q, page = 1, limit = 25 }) {
  const where = [];
  const params = [];
  if (status) { where.push('b.status = ?'); params.push(status); }
  if (date_from) { where.push('b.pickup_date >= ?'); params.push(date_from); }
  if (date_to) { where.push('b.pickup_date <= ?'); params.push(date_to); }
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    where.push('(b.reference LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR b.pickup_location LIKE ? OR b.destination LIKE ?)');
    params.push(like, like, like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM bookings b JOIN customers c ON c.id = b.customer_id ${whereSql}`, params);
  const [rows] = await pool.query(
    `${BOOKING_SELECT} ${whereSql} ORDER BY b.created_at DESC, b.id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { rows: rows.map(withWhatsAppSummary), total };
}

async function nextReference(conn) {
  const year = yearInTz(config.timezone);
  // LAST_INSERT_ID(expr) makes the counter increment atomic and race-safe.
  await conn.query(
    'INSERT INTO booking_counters (year, last_number) VALUES (?, LAST_INSERT_ID(1)) ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)',
    [year],
  );
  const [[{ n }]] = await conn.query('SELECT LAST_INSERT_ID() AS n');
  return `SER-${year}-${String(n).padStart(5, '0')}`;
}

/** Validates the service, upserts the customer, generates the reference and stores the booking atomically. */
export async function createBooking(data) {
  const [svcRows] = await pool.query('SELECT id, name FROM services WHERE id = ? AND is_active = 1 AND is_bookable = 1', [data.service_id]);
  const service = svcRows[0];
  if (!service) throw badRequest('Please choose a valid service type.');

  const phone = normalizePhone(data.phone, config.countryCode);

  const id = await withTransaction(async (conn) => {
    const [cust] = await conn.query(
      `INSERT INTO customers (name, phone, email) VALUES (?, ?, ?) AS new
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(customers.id), name = new.name, email = COALESCE(new.email, customers.email)`,
      [data.customer_name, phone, data.email || null],
    );
    const reference = await nextReference(conn);
    const [res] = await conn.query(
      `INSERT INTO bookings
        (reference, customer_id, service_id, service_name, pickup_location, destination, pickup_date, pickup_time,
         passengers, vehicle_type, notes, flight_number, airport_direction, airport_name, luggage_count)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        reference, cust.insertId, service.id, service.name, data.pickup_location, data.destination,
        data.pickup_date, `${data.pickup_time}:00`, data.passengers, data.vehicle_type || null, data.notes || null,
        data.flight_number || null, data.airport_direction || null, data.airport_name || null,
        data.luggage_count ?? null,
      ],
    );
    await conn.query(
      'INSERT INTO booking_status_history (booking_id, from_status, to_status, note) VALUES (?, NULL, ?, ?)',
      [res.insertId, 'PENDING', 'Booking received from website'],
    );
    return res.insertId;
  });

  return getBookingById(id);
}

async function refreshDriverStatus(conn, driverId) {
  if (!driverId) return;
  const [[{ active }]] = await conn.query(
    `SELECT COUNT(*) AS active FROM bookings WHERE driver_id = ? AND status IN (${ACTIVE_DRIVER_STATUSES.map(() => '?').join(',')})`,
    [driverId, ...ACTIVE_DRIVER_STATUSES],
  );
  // Do not override a driver the admin deliberately marked OFFLINE
  await conn.query(`UPDATE drivers SET status = ? WHERE id = ? AND status <> 'OFFLINE'`, [active ? 'BUSY' : 'AVAILABLE', driverId]);
}

export async function changeStatus(id, status, userId, note) {
  await withTransaction(async (conn) => {
    const [[current]] = await conn.query('SELECT id, status, driver_id FROM bookings WHERE id = ? FOR UPDATE', [id]);
    if (!current) throw badRequest('Booking not found');
    if (status === 'ASSIGNED' && !current.driver_id) throw badRequest('Assign a driver before setting the status to ASSIGNED.');
    if (current.status !== status) {
      await conn.query('UPDATE bookings SET status = ?, seen_by_admin = 1 WHERE id = ?', [status, id]);
      await conn.query(
        'INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by, note) VALUES (?,?,?,?,?)',
        [id, current.status, status, userId, note || null],
      );
    }
    await refreshDriverStatus(conn, current.driver_id);
  });
  return getBookingById(id);
}

export async function assignDriver(id, { driver_id, vehicle_id }, userId) {
  await withTransaction(async (conn) => {
    const [[booking]] = await conn.query('SELECT id, status, driver_id FROM bookings WHERE id = ? FOR UPDATE', [id]);
    if (!booking) throw badRequest('Booking not found');
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) throw badRequest(`A ${booking.status.toLowerCase()} booking cannot be reassigned.`);

    const [[driver]] = await conn.query('SELECT id, vehicle_id, is_active FROM drivers WHERE id = ?', [driver_id]);
    if (!driver || !driver.is_active) throw badRequest('Choose an active driver.');
    const vehicleId = vehicle_id ?? driver.vehicle_id ?? null;

    await conn.query('UPDATE bookings SET driver_id = ?, vehicle_id = ?, seen_by_admin = 1 WHERE id = ?', [driver_id, vehicleId, id]);
    if (['PENDING', 'CONFIRMED'].includes(booking.status)) {
      await conn.query(`UPDATE bookings SET status = 'ASSIGNED' WHERE id = ?`, [id]);
      await conn.query(
        'INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by, note) VALUES (?,?,?,?,?)',
        [id, booking.status, 'ASSIGNED', userId, 'Driver assigned'],
      );
    }
    await refreshDriverStatus(conn, driver_id);
    if (booking.driver_id && booking.driver_id !== driver_id) await refreshDriverStatus(conn, booking.driver_id);
  });
  return getBookingById(id);
}

export async function getStatusHistory(id) {
  const [rows] = await pool.query(
    `SELECT h.*, u.name AS changed_by_name FROM booking_status_history h
     LEFT JOIN users u ON u.id = h.changed_by WHERE h.booking_id = ? ORDER BY h.id ASC`, [id]);
  return rows;
}
