# Secure Eco Ride

**Safe journeys, cleaner tomorrow.**

A full-stack website and booking management system for Secure Eco Ride, a taxi and
transportation company. Built with React + Vite + Tailwind on the frontend, Node.js +
Express + MySQL on the backend, and official WhatsApp Business Cloud API notifications
for every new booking.

```
project/
├── client/      React + Vite + Tailwind frontend
├── server/      Node.js + Express API
├── database/    MySQL schema
└── .env.example Copy to .env in the project root
```

---

## 1. Requirements

- Node.js 20+
- MySQL 8.0.19+ (for functional indexes / JSON columns used by the schema)
- npm

---

## 2. Installation

```bash
git clone <this-repo> secure-eco-ride
cd secure-eco-ride

# install both apps
cd server && npm install
cd ../client && npm install
cd ..

# environment
cp .env.example .env
# open .env and fill in DB_PASSWORD, JWT_SECRET, and (when ready) the WhatsApp Cloud API values
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Database setup

```bash
cd server
npm run db:init      # creates the database and all tables from database/schema.sql
npm run seed          # creates the demo admin account + the 4 business-card services
# npm run seed:demo   # optional: also adds two clearly-labelled SAMPLE vehicles
```

`npm run seed` prints the demo admin login. **Change this password before going live**
(Admin → Settings → Change your password, or re-run the seed with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` environment variables set).

> The schema is safe to re-run (`CREATE TABLE IF NOT EXISTS`), so `npm run db:init` can
> be run again after pulling schema changes.

---

## 4. Development

Run both apps in separate terminals:

```bash
cd server && npm run dev     # http://localhost:5000
cd client && npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000`
automatically (see `client/vite.config.js`), so the client needs no `VITE_API_URL`
in development.

Visit:
- **Website:** http://localhost:5173
- **Admin:** http://localhost:5173/admin/login

---

## 5. WhatsApp Cloud API configuration

This is the most important integration in the system: **every new booking is sent to
all three Secure Eco Ride business numbers** via the official
[WhatsApp Business Platform (Cloud API)](https://developers.facebook.com/docs/whatsapp/cloud-api).
There is no automatic "fake" WhatsApp sending — a plain `wa.me` link **cannot** send a
message without a human pressing Send, and this system never pretends otherwise.

### 5.1 Development fallback (no credentials needed)

If `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` are left empty:

- Bookings still save normally and get a real booking reference.
- The booking confirmation screen and the admin booking detail view show **"SEND TO
  0793157373 / 0793520636 / 0793463324"** buttons. Each opens WhatsApp with the exact
  booking message pre-filled — a person must still press **Send**.
- Every attempt is logged in **Admin → WhatsApp logs** with status `SKIPPED` and an
  explanation, so it's always clear nothing was sent automatically.

### 5.2 Production setup

1. Create a [Meta developer app](https://developers.facebook.com/) with the WhatsApp
   product added, and complete Business verification.
2. Add your three business numbers (or a single sending number — see note below) as
   WhatsApp Business phone numbers.
3. Generate a **permanent** access token (System User token), not a 24-hour test token.
4. Set in `.env`:
   ```
   WHATSAPP_ACCESS_TOKEN=EAAG...
   WHATSAPP_PHONE_NUMBER_ID=1234567890
   WHATSAPP_API_VERSION=v21.0
   WHATSAPP_RECIPIENT_1=250793157373
   WHATSAPP_RECIPIENT_2=250793520636
   WHATSAPP_RECIPIENT_3=250793463324
   ```
   **Note:** `WHATSAPP_PHONE_NUMBER_ID` is the ID of the number that *sends* the
   message; `WHATSAPP_RECIPIENT_*` are the numbers that *receive* the booking alert.
   These can be the same number's business account or a dedicated notifications number
   — Meta does not require them to match.
5. **Approve a message template.** WhatsApp only allows free-text business-initiated
   messages to a customer who messaged you in the last 24 hours. For reliable
   notifications, submit a template like this for approval in Meta Business Manager:

   ```
   Name: new_ride_booking          Category: UTILITY          Language: en

   🚕 SECURE ECO RIDE
   NEW RIDE BOOKING

   Booking ID: {{1}}

   👤 Customer: {{2}}
   📞 Phone: {{3}}
   📍 Pickup: {{4}}
   📍 Destination: {{5}}
   📅 Date: {{6}}
   ⏰ Time: {{7}}
   👥 Passengers: {{8}}
   🚘 Service: {{9}}
   📝 Notes: {{10}}

   Please check the Secure Eco Ride admin dashboard and respond to the customer.
   ```

   Once approved, set:
   ```
   WHATSAPP_TEMPLATE_NAME=new_ride_booking
   WHATSAPP_TEMPLATE_LANG=en
   ```
   The system then sends this template (10 ordered parameters, matching
   `server/src/utils/bookingMessage.js`) instead of free text, so delivery does not
   depend on the 24-hour window.

6. Restart the server. Check **Admin → WhatsApp logs** for the connection status
   banner, and use **"Send test message"** to confirm delivery to all three numbers.

### 5.3 How delivery failures are handled

- One recipient failing **never** blocks the other two — each send is independent.
- A booking is **never deleted or hidden** because a WhatsApp send failed. The customer
  always sees "Your booking has been received. Our team will contact you shortly."
- Every attempt (success, failure, or skipped) is written to the `whatsapp_logs` table
  and visible in **Admin → WhatsApp logs**, including the raw API error.
- Failed or skipped sends can be retried individually, or the whole booking can be
  re-sent to all three numbers, from the booking detail view.

---

## 6. Booking system configuration

- **Services** shown in the booking form come from **Admin → Services** (seeded with
  the four services from the business card). Only services marked *bookable* and
  *active* appear publicly.
- **Pricing** is optional and off by default (quotation-based booking). Turn on
  **Admin → Settings → Show prices on the website** and add rules under
  **Admin → Pricing** to display "From X RWF" on service cards.
- **Fleet** vehicles are entered by the admin under **Admin → Vehicles** — nothing is
  invented. The public Fleet page and homepage preview show only vehicles marked
  *"Show on website."*
- **Booking references** use the format `SER-YYYY-00001`, generated with a race-safe
  per-year counter (`booking_counters` table) so two simultaneous bookings can never
  collide.
- **Statuses:** `PENDING → CONFIRMED → ASSIGNED → DRIVER_ON_WAY → PICKED_UP →
  COMPLETED`, or `CANCELLED` at any point. Every change is recorded in
  `booking_status_history`.

---

## 7. Admin credentials (development only)

```
Email:    admin@secureecoride.com
Password: ChangeThisPassword123!
```

⚠️ **This is a demo credential for local development.** `npm run seed` refuses to use
it when `NODE_ENV=production` unless you explicitly set `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. Change the password immediately in Admin → Settings after first
deploying.

---

## 8. Production build

```bash
cd client
SITE_URL=https://www.your-domain.com npm run build     # writes sitemap.xml/robots.txt, then builds to client/dist
```

Two deployment shapes are supported:

**A. Separate hosting (recommended)** — deploy `client/dist` as a static site (Netlify,
Vercel, S3+CloudFront, nginx) and the `server` folder as a Node service (Render,
Railway, a VPS with PM2). Set `VITE_API_URL` to the API's public URL before building,
and `CORS_ORIGINS` on the server to the site's public URL.

**B. Single server** — set `SERVE_CLIENT=true` in `.env`, build the client first, then
`npm start` inside `server`. Express will serve the built React app and the API from
one process/port.

```bash
cd server
NODE_ENV=production npm start
```

Run database migrations/seed once against the production database before first start:

```bash
NODE_ENV=production npm run db:init
NODE_ENV=production ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='a-strong-password' npm run seed
```

### Production checklist

- [ ] Strong, unique `JWT_SECRET` (32+ random characters)
- [ ] Real `DB_PASSWORD`, not the local dev one
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGINS` set to your real domain(s) only
- [ ] WhatsApp Cloud API configured with an approved template (§5.2)
- [ ] Admin password changed from the seed default
- [ ] `SITE_URL` set before `npm run build` (for a correct sitemap.xml)
- [ ] HTTPS terminated in front of the app (reverse proxy / hosting provider)

---

## 9. Testing what you've deployed

1. **Booking flow:** submit a booking on `/booking` → confirm you get a booking
   reference and, in fallback mode, working "Send to…" WhatsApp links.
2. **Admin login:** sign in at `/admin/login`, confirm the dashboard loads.
3. **WhatsApp:** Admin → WhatsApp logs → "Send test message" → confirm delivery (or a
   clear, readable error if not yet configured).
4. **API health:** `curl https://your-domain/api/health` → `{"data":{"ok":true,...}}`.
5. **Responsive design:** check the homepage and booking form at phone, tablet and
   desktop widths; confirm the mobile Call / WhatsApp / Book bar appears under 768px.
6. **Navigation & forms:** click every link in the navbar and footer; submit the
   contact and corporate forms.
7. **Production build:** `npm run build && npm run preview` in `client` to sanity-check
   the built bundle before deploying.

---

## 10. Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, Axios, Lucide React, Framer Motion |
| Backend   | Node.js, Express, JWT (jsonwebtoken), bcryptjs, Zod validation |
| Database  | MySQL 8+ (mysql2) |
| Messaging | WhatsApp Business Cloud API (official), Nodemailer (optional email copy) |

---

## 11. Notes on content honesty

Per the project brief, this codebase does **not** invent company history, vehicles,
prices, office address, customer reviews, or driver information. Everything shown
publicly is either the four services and phone numbers from the business card, or
content an administrator explicitly enters in the dashboard. Empty sections (fleet,
testimonials, pricing) show an honest "not yet available" state rather than placeholder
fabrications.
