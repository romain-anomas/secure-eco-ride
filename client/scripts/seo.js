// Runs before `vite build`: writes public/robots.txt and public/sitemap.xml for the configured domain.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = (process.env.SITE_URL || 'https://www.your-domain.com').replace(/\/$/, '');
if (site.includes('your-domain.com')) console.warn('[seo] SITE_URL is not set — sitemap.xml uses a placeholder domain. Set SITE_URL before deploying.');

const pages = [
  ['/', 1.0], ['/services', 0.8], ['/fleet', 0.7], ['/airport-transfers', 0.8], ['/corporate', 0.7],
  ['/about', 0.6], ['/booking', 0.9], ['/contact', 0.7], ['/privacy', 0.2], ['/terms', 0.2],
];
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
  .map(([p, prio]) => `  <url><loc>${site}${p}</loc><lastmod>${today}</lastmod><priority>${prio.toFixed(1)}</priority></url>`)
  .join('\n')}\n</urlset>\n`;

fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'public', 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`[seo] wrote sitemap.xml and robots.txt for ${site}`);
