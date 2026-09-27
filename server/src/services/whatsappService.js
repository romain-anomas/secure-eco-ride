/**
 * WhatsApp notifications through the official WhatsApp Business Platform (Cloud API).
 *
 *  sendWhatsAppMessage()      -> one message to one recipient (never throws, returns {ok, ...})
 *  sendToAllBusinessNumbers() -> same message to every business recipient, independently,
 *                                one failing recipient never blocks the others; every attempt is logged
 *  sendBookingNotification()  -> builds the booking message and sends it to all business numbers
 *
 * If credentials are missing NOTHING is sent and no success is faked: each recipient is logged
 * as SKIPPED and the caller receives wa.me fallback links (a human must still press Send).
 */
import { config } from '../config/env.js';
import { pool } from '../config/db.js';
import { normalizePhone, toE164, toLocalFormat, waLink } from '../utils/phone.js';
import { buildBookingMessage, buildBookingTemplateParams, buildContactMessage } from '../utils/bookingMessage.js';
import { getSetting } from './settingsService.js';

const cc = config.countryCode;

export const isWhatsAppConfigured = () => Boolean(config.whatsapp.accessToken && config.whatsapp.phoneNumberId);

export function whatsappMode() {
  if (!isWhatsAppConfigured()) return 'FALLBACK';
  return config.whatsapp.templateName ? 'CLOUD_API_TEMPLATE' : 'CLOUD_API_TEXT';
}

/** Business recipients: env vars win, otherwise the WhatsApp numbers saved in admin settings. */
export async function getBusinessRecipients() {
  let raw = config.whatsapp.recipients;
  if (!raw.length) {
    const fromSettings = await getSetting('whatsapp_numbers');
    raw = Array.isArray(fromSettings) ? fromSettings : [];
  }
  const seen = new Set();
  const out = [];
  for (const input of raw) {
    const number = normalizePhone(input, cc); // 0793157373 -> 250793157373
    const key = number || String(input);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ input, number });
  }
  return out;
}

const HINTS = {
  131047: 'Recipient has not messaged your WhatsApp Business number in the last 24 hours. Free-text messages are only delivered inside that window — configure WHATSAPP_TEMPLATE_NAME (approved template) for business-initiated notifications.',
  131030: 'Recipient number is not on the allowed list (test mode). Add it as a test recipient in Meta developer console or go live.',
  131026: 'Message could not be delivered (number may not be on WhatsApp).',
  190: 'Access token is invalid or expired. Generate a new (permanent) token.',
  100: 'Invalid parameter. Check WHATSAPP_PHONE_NUMBER_ID and the recipient number.',
  132001: 'Template name/language not found. Check WHATSAPP_TEMPLATE_NAME and WHATSAPP_TEMPLATE_LANG.',
  132000: 'Template parameter count does not match the approved template.',
};

/** Send one message. Returns { ok, providerMessageId?, error? } and never throws. */
export async function sendWhatsAppMessage({ to, text, template }) {
  const { accessToken, phoneNumberId, apiVersion, timeoutMs } = config.whatsapp;
  if (!isWhatsAppConfigured()) return { ok: false, error: 'WhatsApp Cloud API is not configured' };

  const body = template
    ? {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
          components: [{ type: 'body', parameters: template.params.map((t) => ({ type: 'text', text: t })) }],
        },
      }
    : { messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body: text } };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = json?.error || {};
      const hint = HINTS[e.code] ? ` — ${HINTS[e.code]}` : '';
      return { ok: false, error: `[${e.code ?? res.status}] ${e.message || res.statusText}${hint}`.slice(0, 1500) };
    }
    return { ok: true, providerMessageId: json?.messages?.[0]?.id || null };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? `Timed out after ${timeoutMs} ms` : `Network error: ${err.message}` };
  } finally {
    clearTimeout(timer);
  }
}

async function writeLog({ bookingId = null, contactId = null, reference = null, recipient, message, payload, status, providerMessageId = null, error = null }) {
  try {
    const [res] = await pool.query(
      `INSERT INTO whatsapp_logs (booking_id, contact_id, reference, recipient, message, payload, status, provider_message_id, error)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [bookingId, contactId, reference, recipient, message, payload ? JSON.stringify(payload) : null, status, providerMessageId, error],
    );
    return res.insertId;
  } catch (err) {
    console.error('[whatsapp] could not write log row:', err.message);
    return null;
  }
}

/** Sends the same payload to every business recipient. Never throws. */
export async function sendToAllBusinessNumbers({ text, template }, ref = {}) {
  const recipients = await getBusinessRecipients();
  const configured = isWhatsAppConfigured();
  const payload = template ? { template } : null;

  const results = await Promise.all(
    recipients.map(async (r) => {
      const display = r.number ? toE164(r.number) : String(r.input);
      let outcome;
      try {
        if (!r.number) outcome = { status: 'FAILED', error: `Invalid phone number "${r.input}"` };
        else if (!configured) outcome = { status: 'SKIPPED', error: 'WhatsApp Cloud API is not configured — no message was sent automatically.' };
        else {
          const res = await sendWhatsAppMessage({ to: r.number, text, template });
          outcome = res.ok ? { status: 'SENT', providerMessageId: res.providerMessageId } : { status: 'FAILED', error: res.error };
        }
      } catch (err) {
        outcome = { status: 'FAILED', error: err.message };
      }
      const id = await writeLog({ ...ref, recipient: display, message: text, payload, ...outcome });
      return { id, recipient: display, ...outcome };
    }),
  );
  return { configured, results };
}

/** wa.me links (development fallback): they only OPEN a chat with the message pre-filled. */
export async function buildFallbackLinks(text) {
  const recipients = await getBusinessRecipients();
  return recipients
    .filter((r) => r.number)
    .map((r) => ({
      label: `SEND TO ${toLocalFormat(r.number, cc)}`,
      recipient: toE164(r.number),
      url: waLink(r.number, text),
    }));
}

const templateFor = (params) =>
  config.whatsapp.templateName ? { name: config.whatsapp.templateName, language: config.whatsapp.templateLang, params } : undefined;

/** Main entry used by the booking controller. */
export async function sendBookingNotification(booking) {
  const text = buildBookingMessage(booking, cc);
  const template = templateFor(buildBookingTemplateParams(booking, cc));
  const { configured, results } = await sendToAllBusinessNumbers({ text, template }, { bookingId: booking.id, reference: booking.reference });
  return {
    configured,
    message: text,
    results,
    fallbackLinks: configured ? [] : await buildFallbackLinks(text),
  };
}

export async function sendContactNotification(contact) {
  const text = buildContactMessage(contact, cc);
  // Contact enquiries have no approved template, so they use free text (inside the 24h window).
  return sendToAllBusinessNumbers({ text }, { contactId: contact.id, reference: contact.type === 'CORPORATE' ? 'CORPORATE' : 'CONTACT' });
}

/** Retry a single failed/skipped log row using its stored message/template. */
export async function retryLog(logId) {
  const [rows] = await pool.query('SELECT * FROM whatsapp_logs WHERE id = ?', [logId]);
  const log = rows[0];
  if (!log) return null;
  const number = normalizePhone(log.recipient, cc);
  let outcome;
  if (!number) outcome = { status: 'FAILED', error: `Invalid phone number "${log.recipient}"` };
  else if (!isWhatsAppConfigured()) outcome = { status: 'SKIPPED', error: 'WhatsApp Cloud API is not configured — no message was sent automatically.' };
  else {
    const template = log.payload?.template; // mysql2 parses JSON columns
    const res = await sendWhatsAppMessage({ to: number, text: log.message, template });
    outcome = res.ok ? { status: 'SENT', providerMessageId: res.providerMessageId } : { status: 'FAILED', error: res.error };
  }
  await pool.query(
    'UPDATE whatsapp_logs SET status = ?, error = ?, provider_message_id = ?, attempts = attempts + 1 WHERE id = ?',
    [outcome.status, outcome.error || null, outcome.providerMessageId || null, logId],
  );
  return { id: logId, recipient: log.recipient, ...outcome };
}

/** Re-send a booking notification to all recipients (creates fresh log rows). */
export async function resendBookingNotification(bookingId) {
  const { getBookingById } = await import('./bookingService.js');
  const booking = await getBookingById(bookingId);
  if (!booking) return null;
  return sendBookingNotification(booking);
}

export async function sendTestMessage() {
  const text = '✅ SECURE ECO RIDE\nThis is a test message from the admin dashboard. WhatsApp notifications are working.';
  const params = ['TEST-0000', 'Test Customer', '0700000000', 'Test pickup', 'Test destination', 'Today', '00:00', '1', 'Test', 'Dashboard test message'];
  const { configured, results } = await sendToAllBusinessNumbers({ text, template: templateFor(params) }, { reference: 'TEST' });
  return { configured, results, fallbackLinks: configured ? [] : await buildFallbackLinks(text) };
}
