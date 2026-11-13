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
  await conn.query(`CREATE TABLE IF NOT EXISTS gallery_items (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(120) NOT NULL,
    caption TEXT NULL,
    media_type ENUM('IMAGE','VIDEO') NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_gallery_published_created (is_published, created_at)
  ) ENGINE=InnoDB`);
  await conn.query(
    `INSERT INTO gallery_items (title, media_type, media_url, is_published)
     SELECT 'Secure Eco Ride', 'IMAGE', '/gallery/secure-eco-ride.jpg', 1
     FROM DUAL
     WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE media_url = '/gallery/secure-eco-ride.jpg')`,
  );
  console.log('Gallery table and initial image are ready.');
} catch (err) {
  console.error('Could not create gallery:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
