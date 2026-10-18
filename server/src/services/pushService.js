import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';

let messaging = null;
let setupError = 'Firebase Admin credentials are not configured.';

try {
  let credential;
  let projectId = config.firebase.projectId || undefined;
  if (config.firebase.serviceAccountJson) {
    const account = JSON.parse(config.firebase.serviceAccountJson);
    projectId ||= account.project_id;
    credential = cert(account);
  } else if (config.firebase.credentialsPath || config.firebase.useApplicationDefault) {
    if (config.firebase.credentialsPath && !existsSync(config.firebase.credentialsPath)) {
      throw new Error('Firebase application credential file was not found.');
    }
    credential = applicationDefault();
  }

  if (credential) {
    const app = getApps()[0] || initializeApp({ credential, ...(projectId ? { projectId } : {}) });
    messaging = getMessaging(app);
    setupError = null;
  }
} catch (err) {
  setupError = 'Firebase Admin configuration is invalid.';
  console.error('[fcm] Firebase Admin initialization failed:', err.code || 'configuration_error');
}

export const isFcmConfigured = () => Boolean(messaging);

const tokenHash = (token) => createHash('sha256').update(token).digest('hex');

export async function registerAdminToken(userId, token, deviceName) {
  if (!messaging) throw new Error(setupError || 'Firebase Cloud Messaging is unavailable.');
  const hash = tokenHash(token);
  await pool.query(
    `INSERT INTO admin_push_tokens (user_id, token_hash, token, device_name) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), token = VALUES(token), device_name = VALUES(device_name)`,
    [userId, hash, token, deviceName || null],
  );
  return hash;
}

export async function removeAdminToken(userId, token) {
  await pool.query('DELETE FROM admin_push_tokens WHERE user_id = ? AND token_hash = ?', [userId, tokenHash(token)]);
}

export async function adminTokenCount(userId) {
  const [[row]] = await pool.query('SELECT COUNT(*) AS count FROM admin_push_tokens WHERE user_id = ?', [userId]);
  return Number(row.count);
}

export async function hasAdminToken(userId, hash) {
  const [[row]] = await pool.query(
    'SELECT 1 AS found FROM admin_push_tokens WHERE user_id = ? AND token_hash = ? LIMIT 1',
    [userId, hash],
  );
  return Boolean(row);
}

export async function sendAdminTestPush(userId) {
  if (!messaging) throw new Error(setupError || 'Firebase Cloud Messaging is unavailable.');
  const [devices] = await pool.query(
    `SELECT t.id, t.token FROM admin_push_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.user_id = ? AND u.role = 'ADMIN' AND u.is_active = 1`,
    [userId],
  );
  if (!devices.length) return { registered: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (let start = 0; start < devices.length; start += 500) {
    const batch = devices.slice(start, start + 500);
    const response = await messaging.sendEachForMulticast({
      tokens: batch.map((device) => device.token),
      notification: {
        title: 'Secure Eco Ride test alert',
        body: 'Booking alerts are reaching this device.',
      },
      data: {
        title: 'Secure Eco Ride test alert',
        body: 'Booking alerts are reaching this device.',
        bookingId: `test-${Date.now()}`,
        url: '/admin/bookings',
      },
      webpush: {
        headers: { Urgency: 'high', TTL: '60' },
        notification: {
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
          tag: `secure-eco-ride-test-${Date.now()}`,
          renotify: true,
          silent: false,
          vibrate: [250, 100, 250],
          requireInteraction: true,
        },
        fcmOptions: { link: new URL('/admin/bookings', config.clientUrl).toString() },
      },
    });
    sent += response.successCount;
    failed += response.failureCount;
    for (let i = 0; i < response.responses.length; i += 1) {
      const result = response.responses[i];
      if (result.error && INVALID_TOKEN_CODES.has(result.error.code)) {
        await pool.query('DELETE FROM admin_push_tokens WHERE id = ?', [batch[i].id]);
      } else if (result.error) {
        console.error(`[fcm] test alert failed code=${result.error.code || 'send_failed'}`);
      }
    }
  }
  return { registered: devices.length, sent, failed };
}

function pickupLabel(booking) {
  const date = booking.pickup_date instanceof Date
    ? booking.pickup_date.toISOString().slice(0, 10)
    : String(booking.pickup_date || '').slice(0, 10);
  const time = String(booking.pickup_time || '').slice(0, 5);
  return [date, time].filter(Boolean).join(' ');
}

function bookingPayload(booking) {
  const details = [
    booking.customer_name,
    booking.reference,
    [booking.pickup_location, booking.destination].filter(Boolean).join(' → '),
    pickupLabel(booking),
  ].filter(Boolean);
  return {
    title: '🚗 New Ride Booking!',
    body: details.join(' · ').slice(0, 900),
    bookingId: String(booking.id),
    url: new URL(`/admin/bookings/${booking.id}`, config.clientUrl).toString(),
  };
}

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/** Sends one system-notification FCM message per admin device, idempotent per booking/device. */
export async function sendBookingPush(booking) {
  if (!messaging) return;
  const [devices] = await pool.query(
    `SELECT t.id, t.token_hash, t.token
     FROM admin_push_tokens t JOIN users u ON u.id = t.user_id
     WHERE u.role = 'ADMIN' AND u.is_active = 1`,
  );
  if (!devices.length) return;

  const pending = [];
  for (const device of devices) {
    const [insert] = await pool.query(
      "INSERT IGNORE INTO admin_push_deliveries (booking_id, token_hash, status) VALUES (?, ?, 'SENDING')",
      [booking.id, device.token_hash],
    );
    if (insert.affectedRows === 1) pending.push(device);
  }

  const payload = bookingPayload(booking);
  for (let start = 0; start < pending.length; start += 500) {
    const batch = pending.slice(start, start + 500);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch.map((device) => device.token),
        notification: { title: payload.title, body: payload.body },
        data: payload,
        webpush: {
          headers: { Urgency: 'high', TTL: '2419200' },
          notification: {
            icon: '/pwa-192.png',
            badge: '/pwa-192.png',
            tag: `booking-${booking.id}`,
            renotify: true,
            silent: false,
            vibrate: [250, 100, 250, 100, 400],
            requireInteraction: true,
          },
          fcmOptions: { link: payload.url },
        },
      });
      for (let i = 0; i < response.responses.length; i += 1) {
        const device = batch[i];
        const result = response.responses[i];
        const status = result.success ? 'SENT' : 'FAILED';
        const code = result.success ? null : (result.error?.code || 'send_failed').slice(0, 100);
        await pool.query(
          'UPDATE admin_push_deliveries SET status = ?, error_code = ?, sent_at = IF(? = \'SENT\', CURRENT_TIMESTAMP, NULL) WHERE booking_id = ? AND token_hash = ?',
          [status, code, status, booking.id, device.token_hash],
        );
        if (code && INVALID_TOKEN_CODES.has(code)) {
          await pool.query('DELETE FROM admin_push_tokens WHERE id = ?', [device.id]);
        } else if (code) {
          console.error(`[fcm] booking alert failed booking=${booking.reference} code=${code}`);
        }
      }
    } catch (err) {
      const code = (err.code || 'send_failed').slice(0, 100);
      await pool.query(
        `UPDATE admin_push_deliveries SET status = 'FAILED', error_code = ?
         WHERE booking_id = ? AND token_hash IN (${batch.map(() => '?').join(',')}) AND status = 'SENDING'`,
        [code, booking.id, ...batch.map((device) => device.token_hash)],
      );
      console.error(`[fcm] booking alert failed booking=${booking.reference} code=${code}`);
    }
  }
}
