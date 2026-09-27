import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { pool } from '../config/db.js';
import { forbidden, unauthorized } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function userFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  const [rows] = await pool.query('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [payload.sub]);
  const user = rows[0];
  return user && user.is_active ? user : null;
}

/** Requires a valid token. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const user = await userFromRequest(req);
  if (!user) throw unauthorized('Your session has expired. Please sign in again.');
  req.user = user;
  next();
});

/** Sets req.user when a valid token is present, otherwise continues anonymously. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = (await userFromRequest(req)) || null;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};

export const adminOnly = requireRole('ADMIN');
export const staffOrAdmin = requireRole('ADMIN', 'STAFF');
