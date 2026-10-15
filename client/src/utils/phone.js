// Convert a national number plus the selected calling code to international digits.
import { PHONE_COUNTRIES } from './phoneCountries.js';
import { phoneLengthRange } from './phoneLengthRules.js';

const hasNationalLength = (digits, countryCode) => {
  const national = digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits;
  const [min, max] = phoneLengthRange(countryCode);
  return national.length >= min && national.length <= max;
};

export function normalizePhone(input, countryCode = '250') {
  if (input == null) return null;
  const raw = String(input).trim();
  const hasPlus = raw.startsWith('+');
  let s = raw.replace(/\D/g, '');
  if (!s) return null;
  if (hasPlus || s.startsWith('00')) {
    if (!hasPlus) s = s.slice(2);
    const country = PHONE_COUNTRIES.map(({ code }) => code).sort((a, b) => b.length - a.length).find((code) => s.startsWith(code));
    return country && hasNationalLength(s, country) ? s : null;
  }
  if (s.startsWith('0')) s = s.slice(1);
  else if (s.startsWith(countryCode) && hasNationalLength(s, countryCode)) return s;
  else if (s.length > phoneLengthRange(countryCode)[1] && PHONE_COUNTRIES.some(({ code }) => s.startsWith(code))) return null;
  const international = countryCode + s;
  return hasNationalLength(international, countryCode) ? international : null;
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
