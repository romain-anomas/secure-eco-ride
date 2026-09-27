import { pool } from '../config/db.js';

/** Every setting the admin can edit, with safe defaults. Nothing here is invented company data. */
export const DEFAULT_SETTINGS = {
  company_name: 'Secure Eco Ride',
  slogan: 'Safe journeys, cleaner tomorrow.',
  tagline: 'Your reliable taxi service for every journey.',
  company_description:
    'Secure Eco Ride provides safe, reliable and professional taxi transportation, airport transfers, corporate travel and private rides.',
  about_text:
    'We are a taxi service built around three promises: your safety, professional drivers, and a cleaner tomorrow.\n\nWhether you need a local trip, a long-distance ride, an airport transfer or regular business travel, our team confirms every booking personally and keeps you informed until you arrive.',
  phone_numbers: ['0793157373', '0793520636', '0793463324'],
  whatsapp_numbers: ['0793157373', '0793520636', '0793463324'],
  email: '',
  address: '',
  service_areas: '',
  business_hours: '',
  social_links: { facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '' },
  logo_url: '',
  hero_image_url: '',
  show_prices: false,
  currency: 'RWF',
};

export const PUBLIC_SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

function parse(raw) {
  try { return JSON.parse(raw); } catch { return raw; }
}

export async function getAllSettings() {
  const [rows] = await pool.query('SELECT setting_key, value FROM settings');
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.setting_key in DEFAULT_SETTINGS && r.value !== null) out[r.setting_key] = parse(r.value);
  return out;
}

export async function getSetting(key) {
  return (await getAllSettings())[key];
}

export async function updateSettings(values) {
  const entries = Object.entries(values).filter(([k]) => k in DEFAULT_SETTINGS);
  for (const [k, v] of entries) {
    await pool.query(
      'INSERT INTO settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [k, JSON.stringify(v)],
    );
  }
  return getAllSettings();
}
