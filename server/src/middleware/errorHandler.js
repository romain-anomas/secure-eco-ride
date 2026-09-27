import { ZodError } from 'zod';
import multer from 'multer';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: { message: details[0]?.message || 'Please check the form and try again.', details } });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 4 MB).' : err.message;
    return res.status(400).json({ error: { message } });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: { message: 'That value already exists. Please use a different one.' } });
  }
  if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: { message: 'This record is linked to other data and cannot be changed that way.' } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Invalid JSON body.' } });
  }
  if (err?.status && err.expose) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: { message: config.isProd ? 'Something went wrong. Please try again.' : String(err?.message || err) } });
}
