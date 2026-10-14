import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { config } from './config/env.js';
import { pool } from './config/db.js';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images are loaded from the Vite dev origin too
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://www.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'https://*.googleapis.com'],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin(origin, cb) {
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
    // During LAN development, the browser origin uses the machine's private IP
    // rather than localhost. Keep this exception limited to Vite's dev port.
    if (config.env === 'development') {
      try {
        const url = new URL(origin);
        const privateIPv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
        if (url.protocol === 'http:' && url.port === '5173' && privateIPv4) return cb(null, true);
      } catch { /* malformed Origin is rejected below */ }
    }
    cb(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: false,
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));
app.use('/api', apiLimiter, routes);
app.use('/api', notFoundHandler);

// Optional: serve the built React app from this same server (see README → Deployment)
if (config.serveClient && fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist, { maxAge: '1h', index: false }));
  app.use('/assets', express.static(path.join(config.clientDist, 'assets'), { maxAge: '365d', immutable: true }));
  app.get('*', (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
}

app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', async () => {
  console.log(`Secure Eco Ride API listening on http://localhost:${config.port} (${config.env})`);
  const lanAddresses = Object.values(os.networkInterfaces()).flatMap((entries) => entries || [])
    .filter((entry) => entry.family === 'IPv4' && !entry.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address))
    .map((entry) => entry.address);
  for (const address of [...new Set(lanAddresses)]) console.log(`API on your network: http://${address}:${config.port}`);
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connection OK');
  } catch (err) {
    console.error(`MySQL connection FAILED: ${err.message}\nCheck DB_* values in .env and run "npm run db:init".`);
  }
});

const shutdown = () => server.close(() => pool.end().finally(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
