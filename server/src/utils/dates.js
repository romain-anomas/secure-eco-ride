const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Today's date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(tz = 'Africa/Kigali', date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export const yearInTz = (tz, date = new Date()) => Number(todayInTz(tz, date).slice(0, 4));

export function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 2026-09-20 -> "20 September 2026" (locale independent) */
export function formatDateLong(s) {
  if (!isValidDateString(s)) return s || '';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "14:30:00" -> "14:30" */
export const formatTimeShort = (t) => (t ? String(t).slice(0, 5) : '');
