import mysql from 'mysql2/promise';
import { config } from '../src/config/env.js';

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
});

try {
  const [[column]] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'customer_photo_url'`,
  );
  if (column) {
    console.log('Testimonial customer photo column already exists.');
  } else {
    await conn.query('ALTER TABLE testimonials ADD COLUMN customer_photo_url VARCHAR(500) NULL AFTER customer_name');
    console.log('Testimonial customer photo column is ready.');
  }
} catch (err) {
  console.error('Could not add testimonial customer photo column:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
