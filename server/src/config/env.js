import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '../..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

// Project-root .env first, then an optional server/.env (values already set are not overridden)
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });
dotenv.config({ path: path.join(SERVER_ROOT, '.env') });

const env = process.env;
const num = (v, d) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

export const config = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  port: num(env.PORT, 5000),
  timezone: env.TIMEZONE || 'Africa/Kigali',
  countryCode: env.DEFAULT_COUNTRY_CODE || '250',
  clientUrl: env.FRONTEND_URL || env.CLIENT_URL || 'http://localhost:5173',
  corsOrigins: list(env.CORS_ORIGINS || 'http://localhost:5173'),
  trustProxy: env.TRUST_PROXY === 'true' ? 1 : num(env.TRUST_PROXY, 0),
  serveClient: env.SERVE_CLIENT === 'true',
  uploadDir: path.resolve(SERVER_ROOT, env.UPLOAD_DIR || 'uploads'),
  clientDist: path.join(PROJECT_ROOT, 'client', 'dist'),
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: num(env.DB_PORT, 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    name: env.DB_NAME || 'secure_eco_ride',
  },
  jwt: { secret: env.JWT_SECRET || '', expiresIn: env.JWT_EXPIRES_IN || '8h' },
  whatsapp: {
    accessToken: env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: env.WHATSAPP_API_VERSION || 'v21.0',
    // Kept in international format WITHOUT "+" or spaces, e.g. 250793157373
    recipients: [env.WHATSAPP_RECIPIENT_1, env.WHATSAPP_RECIPIENT_2, env.WHATSAPP_RECIPIENT_3]
      .map((v) => (v || '').trim())
      .filter(Boolean),
    templateName: env.WHATSAPP_TEMPLATE_NAME || '',
    templateLang: env.WHATSAPP_TEMPLATE_LANG || 'en',
    timeoutMs: num(env.WHATSAPP_TIMEOUT_MS, 10000),
  },
  smtp: {
    host: env.SMTP_HOST || '',
    port: num(env.SMTP_PORT, 587),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.EMAIL_FROM || env.SMTP_FROM || 'Secure Eco Ride <no-reply@localhost>',
    notifyTo: list(env.ADMIN_NOTIFICATION_EMAIL || env.NOTIFY_EMAIL_TO),
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID || '',
    serviceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || '',
    useApplicationDefault: env.FIREBASE_USE_APPLICATION_DEFAULT === 'true',
  },
};

if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is missing. Copy .env.example to .env and set a long random value.');
}
if (config.isProd && (config.jwt.secret.length < 32 || /change|example|secret123/i.test(config.jwt.secret))) {
  throw new Error('JWT_SECRET is too weak for production. Use at least 32 random characters.');
}
