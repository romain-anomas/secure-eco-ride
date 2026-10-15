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

Both development servers also listen on the local network. Vite prints a `Network`
URL when you run `npm run dev` in `client`; open that URL on another device connected
to the same Wi-Fi, for example `http://192.168.1.25:5173`. The API prints its LAN URL
as well, and the Vite proxy forwards the website's API requests to it. If the address
does not load, allow port 5173 through the computer's firewall. These development URLs
are for the same local network; access from outside it needs a public HTTPS deployment.
Push notifications on a phone also require HTTPS outside localhost.

---

## 5. Phone booking alerts

Administrator alerts use Firebase Cloud Messaging (FCM). They are sent only after a booking is committed, only to registered active `ADMIN` devices, and carry the booking reference, pickup/destination, pickup time, and dashboard link. Device registration/removal APIs require an authenticated `ADMIN` token. WhatsApp remains a separate customer/business notification path.

### Firebase project setup

1. Create or select a project in the [Firebase console](https://console.firebase.google.com/).
2. In **Project settings → General**, register a **Web app**. Copy its `apiKey`, `projectId`, `messagingSenderId`, and `appId` to the client variables below. These web values are public; do not put a service-account private key in a `VITE_` variable.
3. In **Project settings → Cloud Messaging → Web Push certificates**, generate a key pair and set its public key as `VITE_FIREBASE_VAPID_KEY`. Enable the Firebase Cloud Messaging API (HTTP v1) for the project if the console prompts you.
4. For the server, use application-default credentials when the host supports them. Otherwise, create a Firebase Admin service-account key in **Project settings → Service accounts** and store the JSON as the server secret `FIREBASE_SERVICE_ACCOUNT_JSON`. Never commit this JSON or put it in the frontend. The service account needs permission to send FCM messages.

### Environment variables

Set these in `client/.env` for local Vite development and in the Vercel project’s **Environment Variables** for production builds:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_API_URL=
```

`VITE_API_URL` is the backend base URL including `/api` (for example `https://YOUR-BACKEND-HOST/api`). Local development may leave it blank because Vite proxies `/api` to `http://localhost:5000`.

Set these server-side in the project-root `.env` for local API development and in the backend host’s secret manager for production:

```dotenv
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=
# Or, instead of FIREBASE_SERVICE_ACCOUNT_JSON, use a protected file path:
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
# Or on supported Google Cloud hosts, use application-default credentials:
FIREBASE_USE_APPLICATION_DEFAULT=true
CLIENT_URL=https://finding-you-ride.vercel.app
CORS_ORIGINS=http://localhost:5173,https://finding-you-ride.vercel.app
```

Use exactly one server credential method: `FIREBASE_SERVICE_ACCOUNT_JSON`, a protected `GOOGLE_APPLICATION_CREDENTIALS` file path, or `FIREBASE_USE_APPLICATION_DEFAULT=true` on a host that supplies ADC. Do not commit the credentials file. `CLIENT_URL` is used to build the notification click URL. Add the real backend URL to `VITE_API_URL`; it could not be determined from this repository, and there is no backend deployment config checked in. Do not point Vercel’s frontend API variable at the Vercel frontend URL unless the API is actually hosted there.

### Database and local testing

The schema adds `admin_push_tokens` and `admin_push_deliveries`. For an existing database, run either `cd server && npm run db:migrate:fcm` or rerun `cd server && npm run db:init` (safe and idempotent). Start the local project using the existing scripts:

```bash
cd server && npm run dev
cd client && npm run dev
```

In one terminal, run `cd server && npm run dev`; in another, run `cd client && npm run dev`. Open `http://localhost:5173/admin`, click **Enable notifications** on the admin dashboard, allow permission, then click **Enable sound** and **Test sound** as needed. Submit a booking from another browser window. Foreground FCM drives the in-dashboard sound/banner; when the admin page is in the background or closed, the Firebase service worker shows one system notification. Clicking it opens that booking. Localhost is treated as a secure context; a phone using the LAN `http://192.168…` URL cannot register web push. Phone testing requires the public HTTPS site and a reachable HTTPS backend. On iPhone, add the site to the Home Screen first. Device notification settings control background alert sound.

### Production deployment

The frontend URL provided for production is `https://finding-you-ride.vercel.app/`. Keep the current Vercel frontend deployment. This repository does not identify the deployed API host or include a Vercel/API deployment configuration, so the production `VITE_API_URL` and the matching backend `CORS_ORIGINS` must be filled with the actual backend URL from its hosting dashboard. The backend must be a reachable Node.js service with the project’s MySQL database and Firebase service credentials; this project does not confirm that the backend runs on Vercel.

After setting Vercel variables, redeploy the frontend so Vite builds them into the client. Set `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` (or host-provided application-default credentials), `CLIENT_URL`, and `CORS_ORIGINS` as backend environment/secrets, then redeploy/restart the API and apply the migration. Firebase web messaging and service workers require HTTPS in production.

---

## 6. WhatsApp Cloud API configuration

This is the most important integration in the system: **every new booking is sent to
all three Secure Eco Ride business numbers** via the official
[WhatsApp Business Platform (Cloud API)](https://developers.facebook.com/docs/whatsapp/cloud-api).
There is no automatic "fake" WhatsApp sending — a plain `wa.me` link **cannot** send a
message without a human pressing Send, and this system never pretends otherwise.

### 6.1 Development fallback (no credentials needed)

If `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` are left empty:

- Bookings still save normally and get a real booking reference.
- The booking confirmation screen and the admin booking detail view show **"SEND TO
  0793157373 / 0793520636 / 0793463324"** buttons. Each opens WhatsApp with the exact
  booking message pre-filled — a person must still press **Send**.
- Every attempt is logged in **Admin → WhatsApp logs** with status `SKIPPED` and an
  explanation, so it's always clear nothing was sent automatically.

### 6.2 Production setup

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

### 6.3 How delivery failures are handled

- One recipient failing **never** blocks the other two — each send is independent.
- A booking is **never deleted or hidden** because a WhatsApp send failed. The customer
  always sees "Your booking has been received. Our team will contact you shortly."
- Every attempt (success, failure, or skipped) is written to the `whatsapp_logs` table
  and visible in **Admin → WhatsApp logs**, including the raw API error.
- Failed or skipped sends can be retried individually, or the whole booking can be
  re-sent to all three numbers, from the booking detail view.

---

## 7. Booking system configuration

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

## 8. Admin credentials (development only)

```
Email:    admin@secureecoride.com
Password: ChangeThisPassword123!
```

⚠️ **This is a demo credential for local development.** `npm run seed` refuses to use
it when `NODE_ENV=production` unless you explicitly set `ADMIN_EMAIL` /
`ADMIN_PASSWORD`. Change the password immediately in Admin → Settings after first
deploying.

---

## 9. Production build

```bash
cd client
SITE_URL=https://secure-eco-ride.vercel.app npm run build     # writes sitemap.xml/robots.txt, then builds to client/dist
```

Two deployment shapes are supported:

**A. Separate hosting (recommended)** — deploy `client/dist` as a static site (Netlify,
Vercel, S3+CloudFront, nginx) and the `server` folder as a Node service (Render,
Railway, a VPS with PM2). Set `VITE_API_URL` to the API's public URL including `/api` before building,
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

## 10. Testing what you've deployed

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

## 11. Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, React Router, Tailwind CSS, Axios, Lucide React, Framer Motion |
| Backend   | Node.js, Express, JWT (jsonwebtoken), bcryptjs, Zod validation |
| Database  | MySQL 8+ (mysql2) |
| Messaging | WhatsApp Business Cloud API (official), Nodemailer (optional email copy) |

---

## 12. Notes on content honesty

Per the project brief, this codebase does **not** invent company history, vehicles,
prices, office address, customer reviews, or driver information. Everything shown
publicly is either the four services and phone numbers from the business card, or
content an administrator explicitly enters in the dashboard. Empty sections (fleet,
testimonials, pricing) show an honest "not yet available" state rather than placeholder
fabrications.

## Booking maps, assignment audit, and booking email

Booking requests can now include optional pickup and destination pins. The full booking form asks for browser location only after the customer presses **Use My Current Location**; customers can also click or drag the pins. Addresses remain the authoritative text fields. The map uses Leaflet with the standard OpenStreetMap tile service and attribution. OpenStreetMap's community tile servers have capacity and usage policies and are not an unlimited or guaranteed production map service; for sustained high traffic, select a compliant tile provider and update `BookingMap.jsx` and `BookingLocationMap.jsx`. No geocoding service is used.

Booking creation and every admin status change use email rather than WhatsApp. An admin status change emails the customer and configured admin inbox using SMTP. The booking detail panel reports delivery state and has no WhatsApp send controls for booking messages. New bookings require a valid email address so the customer can receive status updates. Older bookings without an email remain valid, but need the customer's email added before customer updates can be delivered. Admin email requires `ADMIN_NOTIFICATION_EMAIL` (or legacy `NOTIFY_EMAIL_TO`) in addition to SMTP settings.

The admin booking workflow keeps incoming requests `PENDING`. Open **Review & send**, inspect the booking, select an active driver and the passenger-facing status, then press **Save assignment & send**. The API saves driver and status together before sending email to both recipients. The email includes the assigned driver's contact and vehicle details. On phones, bookings use stacked cards; wider screens use the full table. The protected endpoint is `POST /api/bookings/:id/send-update` with `{ "driver_id": 1, "status": "CONFIRMED", "note": "Optional history note" }`.

Admins can create a login for an active driver from **Drivers**. Give the driver the email and temporary password entered there. Drivers sign in at `/admin/login` and are sent to the mobile-friendly `/driver` portal, where they can mark themselves available or unavailable and see their own assigned rides and passenger contact details. A driver with an active ride remains busy. Driver accounts can change their password after sign-in.

### Database rollout

1. Take a verified backup of the production database and confirm it can be restored.
2. From a MySQL client connected to the Render production database, apply `database/migrations/002_booking_coordinates.sql`, `database/migrations/003_driver_assignment_history.sql`, and `database/migrations/004_driver_accounts.sql` in order. The last migration adds the restricted driver role and a nullable link from driver profiles to login accounts.
3. Deploy the backend and frontend. Existing rows without coordinates continue to appear with text addresses and a no-coordinates note.
4. To roll back application code, redeploy the prior versions. Keep the additive columns and audit table during rollback; the prior code ignores them. Do not drop data-bearing schema objects as part of routine rollback.

Never run `npm run db:init` against production: it is the full schema/bootstrap path. Run migrations only after the backup, against the remote production DB host supplied to the Render service. `DB_HOST` must be the remote database hostname, not `localhost` or `127.0.0.1`. This repository cannot verify the Render database host or reachability from local development.

### Render and Vercel values

Set these in the Render API service environment (never use `VITE_` for secrets):

- `NODE_ENV=production`, `PORT` supplied by Render, and `TRUST_PROXY=1`.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` for the remotely hosted MySQL service.
- `JWT_SECRET` (at least 32 random characters), `FRONTEND_URL=https://secure-eco-ride.vercel.app`, and `CORS_ORIGINS=https://secure-eco-ride.vercel.app` (add an approved preview/development origin only when needed).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, and `ADMIN_NOTIFICATION_EMAIL` for admin booking email. `EMAIL_FROM` and `ADMIN_NOTIFICATION_EMAIL` are aliases supported by this server; older `SMTP_FROM` and `NOTIFY_EMAIL_TO` remain supported.
- Existing WhatsApp and Firebase variables only if those integrations are already configured. Keep all provider credentials in Render secrets.

Use Render's production start command `npm start` from the `server` directory (it runs `node src/server.js`, not the watch server). On Vercel set `VITE_API_URL=https://secure-eco-ride.onrender.com/api` and `SITE_URL=https://secure-eco-ride.vercel.app`; redeploy after changing build variables. Keep the Vercel site and Render API on HTTPS. Socket.IO is not added in this stage.

### Safe SMTP test

After setting the SMTP variables in Render, sign in to the admin dashboard and use an authenticated admin session to call `POST https://secure-eco-ride.onrender.com/api/email/test` with `Authorization: Bearer <admin-token>`. The route sends a fixed test message only to `ADMIN_NOTIFICATION_EMAIL` and is admin-only. A `200` response means the SMTP relay accepted the message; check the recipient inbox and spam folder for actual delivery. A `503` response means configuration or delivery failed; inspect Render logs without printing secrets. SMTP failures are logged and never undo a saved booking.

### Scope and limitations

Admin assignment already existed and remains restricted to staff/admin. New assignment changes receive an audit record and an active booking cannot be assigned to a driver who has another active booking. Driver accounts and a driver dashboard are not present in this application. Customer accounts/booking verification are also absent, so this release does not start or store continuous customer/driver tracking, expose live locations, or add sockets. A public booking reference alone is not authorization to view location data. Add authenticated customer and driver identity before implementing live tracking.
