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
  const [rows] = await pool.query(`SELECT u.id, u.name, u.email, u.role, u.is_active, d.id AS driver_id, d.is_active AS driver_active
    FROM users u LEFT JOIN drivers d ON d.user_id = u.id WHERE u.id = ?`, [payload.sub]);
  const user = rows[0];
  return user && user.is_active && (user.role !== 'DRIVER' || (user.driver_id && user.driver_active)) ? user : null;
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
export const driverOnly = requireRole('DRIVER');
