import { pool } from '../config/db.js';
import { notFound } from '../utils/AppError.js';

const pick = (obj, fields) => Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

/**
 * Small, safe CRUD helper. Column names come from the hard-coded `fields` whitelist,
 * values are always bound parameters (SQL-injection safe).
 */
export function createCrud({ table, fields, json = [], orderBy = 'id DESC', selectSql }) {
  const serialise = (data) => {
    const out = pick(data, fields);
    for (const f of json) if (out[f] !== undefined && out[f] !== null) out[f] = JSON.stringify(out[f]);
    for (const [k, v] of Object.entries(out)) if (typeof v === 'boolean') out[k] = v ? 1 : 0;
    return out;
  };
  const base = selectSql || `SELECT t.* FROM ${table} t`;

  return {
    table,
    async list(where = '', params = []) {
      const [rows] = await pool.query(`${base} ${where} ORDER BY ${orderBy}`, params);
      return rows;
    },
    async get(id) {
      const [rows] = await pool.query(`${base} WHERE t.id = ?`, [id]);
      if (!rows[0]) throw notFound();
      return rows[0];
    },
    async create(data) {
      const row = serialise(data);
      const cols = Object.keys(row);
      const [res] = await pool.query(`INSERT INTO ${table} (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`, Object.values(row));
      return this.get(res.insertId);
    },
    async update(id, data) {
      const row = serialise(data);
      const cols = Object.keys(row);
      if (cols.length) {
        const [res] = await pool.query(`UPDATE ${table} SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`, [...Object.values(row), id]);
        if (!res.affectedRows) throw notFound();
      }
      return this.get(id);
    },
    async remove(id) {
      const [res] = await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
      if (!res.affectedRows) throw notFound();
    },
  };
}
