/**
 * Development seed.
 *   npm run seed            -> admin user + the four services from the business card
 *   npm run seed:demo       -> also adds clearly-labelled SAMPLE vehicles so the fleet UI can be tested
 *
 * !! DEMO CREDENTIALS — for local development only. Change the password immediately in production. !!
 */
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';
import { config } from '../src/config/env.js';

const email = (process.env.ADMIN_EMAIL || 'admin@secureecoride.com').toLowerCase();
const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
const password = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!';

if (config.isProd && usingDefaultPassword) {
  console.error('Refusing to seed the DEMO password in production. Set ADMIN_EMAIL and ADMIN_PASSWORD first.');
  process.exit(1);
}

const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
if (existing.length) {
  console.log(`Admin ${email} already exists — password left unchanged.`);
} else {
  await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)', ['Administrator', email, await bcrypt.hash(password, 12), 'ADMIN']);
  console.log(`Created admin ${email}${usingDefaultPassword ? '  (DEMO password: ChangeThisPassword123!)' : ''}`);
}

const services = [
  ['Local & Long Distance Rides', 'local-long-distance-rides', 'Comfortable trips around town or across the country, with a professional driver.', 'car', 1, 1],
  ['Airport Transfers', 'airport-transfers', 'Scheduled airport pickup and drop-off so you never miss a flight or wait on arrival.', 'plane', 2, 1],
  ['Corporate & Private Travel', 'corporate-private-travel', 'Reliable transport for businesses, hotels, events, executives and private clients.', 'briefcase', 3, 1],
  ['On Time, Every Time', 'on-time-every-time', 'Our promise on every booking: we plan the pickup so you arrive when you need to.', 'clock', 4, 0],
];
for (const [name, slug, description, icon, sort, bookable] of services) {
  await pool.query(
    'INSERT INTO services (name, slug, description, icon, sort_order, is_bookable) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE slug = slug',
    [name, slug, description, icon, sort, bookable],
  );
}
console.log('Services ready.');

if (process.argv.includes('--demo-fleet')) {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM vehicles');
  if (n === 0) {
    const demo = [
      ['SAMPLE Sedan (edit me)', 'Sedan', 4, ['Air conditioning', 'Luggage space']],
      ['SAMPLE SUV (edit me)', 'SUV', 6, ['Air conditioning', 'Extra luggage space']],
    ];
    for (const [name, category, capacity, features] of demo) {
      await pool.query('INSERT INTO vehicles (name, category, capacity, features, description) VALUES (?,?,?,?,?)',
        [name, category, capacity, JSON.stringify(features), 'DEMO DATA — replace with your real vehicle in Admin → Vehicles.']);
    }
    console.log('Added SAMPLE vehicles (demo data — delete them before going live).');
  }
}

await pool.end();
