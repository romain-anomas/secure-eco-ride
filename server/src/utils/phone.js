// Phone helpers. Numbers are stored/sent as international digits WITHOUT "+" (e.g. 250793157373).
const validLength = (s) => s.length >= 8 && s.length <= 15;

/**
 * Normalise a user-typed phone number to international digits.
 *  0793157373      -> 250793157373
 *  +250 793 157373 -> 250793157373
 *  00250793157373  -> 250793157373
 *  793157373       -> 250793157373
 * Returns null when the number cannot be interpreted.
 */
export function normalizePhone(input, countryCode = '250') {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  const hasPlus = raw.startsWith('+');
  let s = raw.replace(/\D/g, '');
  if (!s) return null;

  if (hasPlus) return validLength(s) ? s : null;
  if (s.startsWith('00')) {
    s = s.slice(2);
    return validLength(s) ? s : null;
  }
  if (s.startsWith('0')) {
    const national = s.slice(1);
    return national.length === 9 ? countryCode + national : null;
  }
  if (s.startsWith(countryCode) && s.length === countryCode.length + 9) return s;
  if (s.length === 9) return countryCode + s;
  return validLength(s) ? s : null;
}

export const toE164 = (digits) => (digits ? `+${digits}` : '');

/** 250793157373 -> 0793157373 (only when the country code matches) */
export function toLocalFormat(digits, countryCode = '250') {
  if (!digits) return '';
  const d = String(digits).replace(/\D/g, '');
  return d.startsWith(countryCode) ? `0${d.slice(countryCode.length)}` : `+${d}`;
}

export const telHref = (digits) => `tel:+${digits}`;

export function waLink(digits, text) {
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
