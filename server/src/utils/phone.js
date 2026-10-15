// Typical national significant number lengths after removing the trunk prefix.
const LENGTHS = {
  '1':[10,10],'20':[10,10],'27':[9,9],'30':[10,10],'31':[9,9],'32':[8,9],'33':[9,9],'34':[9,9],
  '36':[9,9],'39':[6,11],'41':[9,9],'43':[7,13],'44':[10,10],'45':[8,8],'46':[7,10],'47':[8,8],'48':[9,9],'49':[7,12],
  '52':[10,10],'54':[10,11],'55':[10,11],'56':[9,9],'57':[10,10],'60':[7,10],'61':[9,9],'62':[7,12],'63':[10,10],'65':[8,8],'66':[9,9],
  '81':[10,10],'82':[8,10],'86':[11,11],'880':[10,10],'852':[8,8],'90':[10,10],'91':[10,10],'92':[10,10],'962':[8,9],'965':[8,8],'968':[8,8],'971':[9,9],'972':[9,9],
  '211':[9,9],'212':[9,9],'213':[9,9],'216':[8,8],'221':[9,9],'225':[10,10],'229':[8,8],'233':[9,9],'234':[10,10],'237':[9,9],'243':[9,9],'250':[9,9],'251':[9,9],'252':[7,9],'254':[9,9],'255':[9,9],'256':[9,9],'257':[8,8],'258':[9,9],'260':[9,9],'263':[9,9],'267':[8,8],'353':[7,9],'358':[7,12],'351':[9,9],'974':[8,8],'966':[9,9],
};
const rangeFor = (cc) => LENGTHS[cc] || [7, 12];
const matchesCountryLength = (digits, cc) => {
  const national = digits.startsWith(cc) ? digits.slice(cc.length) : digits;
  const [min, max] = rangeFor(cc);
  return national.length >= min && national.length <= max;
};

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

  if (hasPlus) {
    const cc = Object.keys(LENGTHS).sort((a, b) => b.length - a.length).find((code) => s.startsWith(code));
    return cc && matchesCountryLength(s, cc) ? s : null;
  }
  if (s.startsWith('00')) {
    s = s.slice(2);
    const cc = Object.keys(LENGTHS).sort((a, b) => b.length - a.length).find((code) => s.startsWith(code));
    return cc && matchesCountryLength(s, cc) ? s : null;
  }
  const internationalCode = Object.keys(LENGTHS).sort((a, b) => b.length - a.length).find((code) => s.startsWith(code));
  if (internationalCode && matchesCountryLength(s, internationalCode)) return s;
  if (s.startsWith('0')) {
    const national = s.slice(1);
    return matchesCountryLength(national, countryCode) ? countryCode + national : null;
  }
  if (s.startsWith(countryCode) && matchesCountryLength(s, countryCode)) return s;
  if (matchesCountryLength(s, countryCode)) return countryCode + s;
  return null;
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
