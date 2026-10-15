import { PHONE_COUNTRIES } from '../utils/phoneCountries.js';
import { phoneLengthRange } from '../utils/phoneLengthRules.js';

export default function PhoneInput({ id, value, onChange, countryCode, onCountryCodeChange, error, required = false, autoComplete = 'tel', placeholder = 'Phone number' }) {
  const [, maxDigits] = phoneLengthRange(countryCode);
  const setLimitedValue = (input) => {
    const cleaned = input.replace(/[^\d+\s().-]/g, '');
    let digitCount = 0;
    let limited = '';
    for (const char of cleaned) {
      if (/\d/.test(char) && digitCount >= maxDigits + (cleaned.trimStart().startsWith('+') ? String(countryCode).length : 1)) continue;
      if (/\d/.test(char)) digitCount += 1;
      limited += char;
    }
    onChange(limited);
  };
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2">
    <select className={`input ${error ? 'input-error' : ''}`} aria-label="Country calling code" value={countryCode} onChange={(e) => onCountryCodeChange(e.target.value)}>
      {PHONE_COUNTRIES.map(({ name, code }) => <option key={`${name}-${code}`} value={code}>+{code} · {name}</option>)}
    </select>
    <input id={id} type="tel" inputMode="tel" className={`input ${error ? 'input-error' : ''}`} value={value} onChange={(e) => setLimitedValue(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} required={required} maxLength={maxDigits + String(countryCode).length + 6} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
  </div>;
}
