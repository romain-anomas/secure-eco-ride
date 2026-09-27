// Mirrors server/src/utils/phone.js so numbers are always displayed / linked correctly.
export function normalizePhone(input, countryCode = '250') {
  if (input == null) return null;
  const raw = String(input).trim();
  const hasPlus = raw.startsWith('+');
  let s = raw.replace(/\D/g, '');
  if (!s) return null;
  const ok = (v) => v.length >= 8 && v.length <= 15;
  if (hasPlus) return ok(s) ? s : null;
  if (s.startsWith('00')) { s = s.slice(2); return ok(s) ? s : null; }
  if (s.startsWith('0')) return s.length === 10 ? countryCode + s.slice(1) : null;
  if (s.startsWith(countryCode) && s.length === countryCode.length + 9) return s;
  if (s.length === 9) return countryCode + s;
  return ok(s) ? s : null;
}

/** Numbers stored in settings ("0793157373") -> international digits ("250793157373"). */
export const toIntl = (n, cc = '250') => normalizePhone(n, cc) || '';

export const telHref = (n, cc) => `tel:+${toIntl(n, cc)}`;

export function whatsappHref(n, text, cc) {
  const base = `https://wa.me/${toIntl(n, cc)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** 250793157373 -> +250 793 157 373 (readable), local numbers untouched */
export function prettyPhone(n) {
  const d = String(n || '').replace(/\D/g, '');
  if (d.startsWith('250') && d.length === 12) return `+250 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return d ? `+${d}` : '';
}

/** 0793157373 -> 0793 157 373 */
export const prettyLocal = (n) => {
  const d = String(n || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}` : String(n || '');
};
