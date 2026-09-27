const TZ = 'Africa/Kigali';

/** API timestamps are UTC strings like "2026-09-20 12:30:00" */
export function parseUtc(s) {
  if (!s) return null;
  const d = new Date(String(s).replace(' ', 'T') + (String(s).endsWith('Z') ? '' : 'Z'));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(s) {
  const d = parseUtc(s);
  return d ? new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d) : '—';
}

/** "2026-09-20" -> "20 Sep 2026" (no timezone shifting: it is a calendar date) */
export function formatDate(s) {
  if (!s) return '—';
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)));
}

export const formatTime = (t) => (t ? String(t).slice(0, 5) : '—');

export const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export const money = (n, currency = 'RWF') => (n === null || n === undefined ? '—' : `${currency} ${Number(n).toLocaleString('en-US')}`);

export const STATUS_LABELS = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', ASSIGNED: 'Driver assigned', DRIVER_ON_WAY: 'Driver on the way',
  PICKED_UP: 'Picked up', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};
export const BOOKING_STATUSES = Object.keys(STATUS_LABELS);
