import mysql from 'mysql2/promise';
import { config } from '../src/config/env.js';

if (!['localhost', '127.0.0.1', '::1'].includes(config.db.host)) {
  console.error('Refusing to alter a non-local database. Apply database/migrations/004_driver_accounts.sql to the intended database manually.');
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
});

try {
  const [[role]] = await conn.query(
    `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
  );
  if (!role) throw new Error('users.role was not found. Initialize the database schema first.');
  if (!role.COLUMN_TYPE.includes("'DRIVER'")) {
    await conn.query("ALTER TABLE users MODIFY role ENUM('ADMIN','STAFF','DRIVER') NOT NULL DEFAULT 'STAFF'");
  }

  const [[driverColumn]] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers' AND COLUMN_NAME = 'user_id'`,
  );
  if (!driverColumn) await conn.query('ALTER TABLE drivers ADD COLUMN user_id INT UNSIGNED NULL AFTER vehicle_id');

  const [[uniqueIndex]] = await conn.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers' AND INDEX_NAME = 'uq_drivers_user_id'`,
  );
  if (!uniqueIndex) await conn.query('ALTER TABLE drivers ADD UNIQUE KEY uq_drivers_user_id (user_id)');

  const [[foreignKey]] = await conn.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers' AND CONSTRAINT_NAME = 'fk_drivers_user'`,
  );
  if (!foreignKey) {
    await conn.query('ALTER TABLE drivers ADD CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL');
  }
  console.log('Driver account schema is ready. Restart the API and sign in again.');
} finally {
  await conn.end();
}
