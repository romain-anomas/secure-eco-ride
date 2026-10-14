import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config, PROJECT_ROOT } from '../src/config/env.js';

const migration = path.join(PROJECT_ROOT, 'database', 'migrations', '001_fcm_admin_push.sql');
const conn = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  multipleStatements: true,
});
try {
  await conn.query(fs.readFileSync(migration, 'utf8'));
  console.log('Firebase admin push tables are ready.');
} catch (err) {
  console.error('Could not apply Firebase push migration:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
