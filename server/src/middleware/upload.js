import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/env.js';
import { badRequest } from '../utils/AppError.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

// SVG is deliberately excluded (can carry scripts).
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(badRequest('Only JPG, PNG, WebP or AVIF images are allowed.'))),
}).single('image');

export const uploadsPublicPath = (filename) => `/uploads/${path.basename(filename)}`;
