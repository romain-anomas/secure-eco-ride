import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
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
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin(origin, cb) {
    if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
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

const server = app.listen(config.port, async () => {
  console.log(`Secure Eco Ride API listening on http://localhost:${config.port} (${config.env})`);
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
