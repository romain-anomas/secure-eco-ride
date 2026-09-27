import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { config } from '../config/env.js';
import { AppError, badRequest, unauthorized } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Compared against when the email is unknown so response time does not reveal valid accounts
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok || !user.is_active) throw new AppError(401, 'Incorrect email or password.');

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  const token = jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, { algorithm: 'HS256', expiresIn: config.jwt.expiresIn });
  res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
});

export const me = (req, res) => res.json({ data: req.user });

export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(current_password, user.password_hash))) throw unauthorized('Current password is incorrect.');
  if (current_password === new_password) throw badRequest('Choose a password you have not used before.');
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(new_password, 12), req.user.id]);
  res.json({ data: { changed: true } });
});
