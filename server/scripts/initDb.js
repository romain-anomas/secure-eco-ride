// Creates the database and all tables from database/schema.sql (safe to re-run: uses IF NOT EXISTS).
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config, PROJECT_ROOT } from '../src/config/env.js';

const schemaPath = path.join(PROJECT_ROOT, 'database', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8').replaceAll('secure_eco_ride', config.db.name);

const conn = await mysql.createConnection({
  host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, multipleStatements: true,
});
try {
  await conn.query(sql);
  console.log(`Database "${config.db.name}" is ready.`);
} catch (err) {
  console.error('Could not initialise the database:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
