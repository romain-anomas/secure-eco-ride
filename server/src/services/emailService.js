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
