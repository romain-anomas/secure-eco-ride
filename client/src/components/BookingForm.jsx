import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { get, post, parseError } from '../services/api.js';
import { normalizePhone } from '../utils/phone.js';
import { todayISO } from '../utils/format.js';
import { DEFAULT_SERVICES } from '../utils/defaults.js';
import BookingConfirmation from './BookingConfirmation.jsx';
import BookingMap from './BookingMap.jsx';
import PhoneInput from './PhoneInput.jsx';
import { DEFAULT_PHONE_COUNTRY } from '../utils/phoneCountries.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

const EMPTY = {
  customer_name: '', phone: '', email: '', pickup_location: '', destination: '', pickup_date: '', pickup_time: '',
  service_id: '', flight_number: '', airport_direction: '', airport_name: '',
  luggage_count: '', website: '',
  pickup_latitude: '', pickup_longitude: '',
};

function Field({ id, label, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-night/55">{hint}</p>}
      {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

/**
 * mode: 'quick'   compact 8-field form (home page)
 *       'full'    booking page (adds email; airport fields appear for airport service)
 *       'airport' airport page (airport fields always shown, airport service preselected)
 */
export default function BookingForm({ mode = 'full', defaultServiceSlug }) {
  const [params] = useSearchParams();
  const { phones, tel } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesFailed, setServicesFailed] = useState(false);
  const [locationStatus, setLocationStatus] = useState('detecting');
  const pickupEdited = useRef(false);
  const locationRequest = useRef(0);
  const topRef = useRef(null);
  const submissionKey = useRef(null);

  // Carry the trip basics from the homepage search into the full booking form.
  useEffect(() => {
    const prefill = {};
    ['pickup_location', 'destination', 'pickup_date'].forEach((key) => {
      const value = params.get(key);
      if (value) prefill[key] = value;
    });
    if (Object.keys(prefill).length) setForm((current) => ({ ...current, ...prefill }));
  }, [params]);

  useEffect(() => {
    let alive = true;
    get('/services')
      .then((r) => alive && setServices(r.data.filter((s) => s.is_bookable)))
      .catch(() => { if (alive) { setServicesFailed(true); setServices(DEFAULT_SERVICES.filter((s) => s.is_bookable)); } });
    return () => { alive = false; };
  }, [mode]);

  const detectPickupLocation = useCallback(() => {
    const requestId = ++locationRequest.current;
    if (pickupEdited.current) {
      setLocationStatus('manual');
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (requestId !== locationRequest.current) return;
      if (pickupEdited.current) {
        setLocationStatus('manual');
        return;
      }
      setForm((current) => ({
        ...current,
        pickup_location: current.pickup_location.trim() && !['Current location', 'Pinned map location'].includes(current.pickup_location) ? current.pickup_location : 'Current location',
        pickup_latitude: String(coords.latitude),
        pickup_longitude: String(coords.longitude),
      }));
      setLocationStatus('detected');
    }, (error) => {
      if (requestId !== locationRequest.current) return;
      setLocationStatus(error.code === 1 ? 'denied' : 'unavailable');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }, []);

  useEffect(() => {
    detectPickupLocation();
    return () => { locationRequest.current += 1; };
  }, [params, detectPickupLocation]);

  // Preselect service from the page (airport) or ?service=slug
  const wantedSlug = defaultServiceSlug || params.get('service');
  useEffect(() => {
    if (!services.length || form.service_id) return;
    const match = services.find((s) => s.slug === wantedSlug);
    if (match) setForm((f) => ({ ...f, service_id: String(match.id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, wantedSlug]);

  const selected = services.find((s) => String(s.id) === String(form.service_id));
  const showAirport = mode === 'airport' || /airport/i.test(selected?.slug || '');
  const today = useMemo(todayISO, []);

  const set = (k) => (e) => {
    submissionKey.current = null;
    if (k === 'pickup_location') {
      pickupEdited.current = true;
      locationRequest.current += 1;
      setLocationStatus('manual');
    }
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const pickupPoint = form.pickup_latitude !== '' && form.pickup_longitude !== ''
    ? { latitude: Number(form.pickup_latitude), longitude: Number(form.pickup_longitude) }
    : null;

  function setPickupPoint(latitude, longitude) {
    pickupEdited.current = true;
    submissionKey.current = null;
    setLocationStatus('detected');
    setForm((current) => ({
      ...current,
      pickup_location: current.pickup_location.trim() ? current.pickup_location : 'Pinned map location',
      pickup_latitude: String(latitude),
      pickup_longitude: String(longitude),
    }));
    setErrors((current) => ({ ...current, pickup_location: undefined, pickup_pin: undefined }));
  }

  function validate() {
    const e = {};
    if (form.customer_name.trim().length < 2) e.customer_name = 'Enter your name';
    if (!normalizePhone(form.phone, phoneCountryCode)) e.phone = 'Enter a valid phone number for the selected country';
    if (!form.email.trim()) e.email = 'Enter your email address';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.pickup_location.trim().length < 2) e.pickup_location = 'Enter the pickup location';
    if (!pickupPoint) e.pickup_pin = 'Detect your location or select a pickup pin on the map';
    if (form.destination.trim().length < 2) e.destination = 'Enter the destination';
    if (!form.pickup_date) e.pickup_date = 'Choose a date';
    else if (form.pickup_date < today) e.pickup_date = 'The date cannot be in the past';
    if (!form.pickup_time) e.pickup_time = 'Choose a time';
    if (showAirport && form.luggage_count !== '') {
      const luggageCount = Number(form.luggage_count);
      if (!Number.isInteger(luggageCount) || luggageCount < 0 || luggageCount > 50) e.luggage_count = 'Enter a whole number from 0 to 50';
    }
    if (!form.service_id) e.service_id = 'Choose a service';
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0] === 'pickup_pin' ? 'bf-pickup_pin' : `bf-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    submissionKey.current ||= globalThis.crypto?.randomUUID?.();
    if (!submissionKey.current) {
      const bytes = new Uint8Array(16);
      if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
      else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      submissionKey.current = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    const payload = { ...form, phone: normalizePhone(form.phone, phoneCountryCode), request_key: submissionKey.current, passengers: 1, service_id: Number(form.service_id) };
    if (!showAirport) ['flight_number', 'airport_direction', 'airport_name', 'luggage_count'].forEach((k) => delete payload[k]);
    Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);

    setSubmitting(true);
    try {
      const res = await post('/bookings', payload);
      setResult(res.data);
      submissionKey.current = null;
      setForm(EMPTY);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fields);
      setFormError(p.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <div ref={topRef}><BookingConfirmation result={result} onReset={() => { setResult(null); pickupEdited.current = false; setForm(EMPTY); detectPickupLocation(); }} /></div>;

  const inputCls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  const aria = (k) => ({ 'aria-invalid': Boolean(errors[k]), 'aria-describedby': errors[k] ? `bf-${k}-error` : undefined });
  const grid = mode === 'quick' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4' : 'grid gap-4 sm:grid-cols-2';

  return (
    <form onSubmit={onSubmit} noValidate ref={topRef}>
      {/* honeypot — hidden from people, bots fill it in */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
      </div>

      <div className={grid}>
        <Field id="bf-pickup_location" label="Pickup location" error={errors.pickup_location}
          hint="Add an address or landmark to help your driver find you. The required map pin is shown below.">
          <input id="bf-pickup_location" className={inputCls('pickup_location')} value={form.pickup_location} onChange={set('pickup_location')} placeholder="Where should we pick you up?" autoComplete="street-address" {...aria('pickup_location')} />
        </Field>
        <Field id="bf-destination" label="Destination" error={errors.destination}>
          <input id="bf-destination" className={inputCls('destination')} value={form.destination} onChange={set('destination')} placeholder="Where are you going?" {...aria('destination')} />
        </Field>
        <BookingMap point={pickupPoint} onChange={setPickupPoint} locationStatus={locationStatus} error={errors.pickup_pin} />
        <Field id="bf-pickup_date" label="Date" error={errors.pickup_date}>
          <input id="bf-pickup_date" type="date" min={today} className={inputCls('pickup_date')} value={form.pickup_date} onChange={set('pickup_date')} {...aria('pickup_date')} />
        </Field>
        <Field id="bf-pickup_time" label="Time" error={errors.pickup_time}>
          <input id="bf-pickup_time" type="time" className={inputCls('pickup_time')} value={form.pickup_time} onChange={set('pickup_time')} {...aria('pickup_time')} />
        </Field>
        <Field id="bf-service_id" label="Service type" error={errors.service_id}>
          <select id="bf-service_id" className={inputCls('service_id')} value={form.service_id} onChange={set('service_id')} {...aria('service_id')}>
            <option value="">Choose a service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field id="bf-customer_name" label="Your name" error={errors.customer_name}>
          <input id="bf-customer_name" className={inputCls('customer_name')} value={form.customer_name} onChange={set('customer_name')} autoComplete="name" placeholder="Full name" {...aria('customer_name')} />
        </Field>
        <Field id="bf-phone" label="Phone number" error={errors.phone}>
          <PhoneInput id="bf-phone" value={form.phone} onChange={(value) => { setForm((f) => ({ ...f, phone: value })); setErrors((x) => ({ ...x, phone: undefined })); }} countryCode={phoneCountryCode} onCountryCodeChange={(value) => { setPhoneCountryCode(value); setErrors((x) => ({ ...x, phone: undefined })); }} error={errors.phone} required placeholder="e.g. 793 157 373" />
        </Field>

        <Field id="bf-email" label="Email address" error={errors.email} hint="We’ll email you when your booking status changes.">
          <input id="bf-email" type="email" className={inputCls('email')} value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" {...aria('email')} />
        </Field>
        {showAirport && mode !== 'quick' && (
          <>
            <Field id="bf-airport_direction" label="Arrival or departure" error={errors.airport_direction}>
              <select id="bf-airport_direction" className={inputCls('airport_direction')} value={form.airport_direction} onChange={set('airport_direction')}>
                <option value="">Not sure / not applicable</option>
                <option value="ARRIVAL">Arrival — pick me up at the airport</option>
                <option value="DEPARTURE">Departure — take me to the airport</option>
              </select>
            </Field>
            <Field id="bf-airport_name" label="Airport" error={errors.airport_name}>
              <input id="bf-airport_name" className={inputCls('airport_name')} value={form.airport_name} onChange={set('airport_name')} placeholder="Airport name" />
            </Field>
            <Field id="bf-flight_number" label="Flight number" error={errors.flight_number} hint="Helps us track delays.">
              <input id="bf-flight_number" className={inputCls('flight_number')} value={form.flight_number} onChange={set('flight_number')} placeholder="e.g. WB100" autoCapitalize="characters" />
            </Field>
            <Field id="bf-luggage_count" label="Luggage (pieces)" error={errors.luggage_count}>
              <input id="bf-luggage_count" type="number" min="0" max="50" step="1" inputMode="numeric" className={inputCls('luggage_count')} value={form.luggage_count} onChange={set('luggage_count')} {...aria('luggage_count')} />
            </Field>
          </>
        )}

      </div>

      {servicesFailed && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          We could not load live service options. You can still try to submit, or call us{phones[0] && <> on <a className="font-bold underline" href={tel(phones[0])}>{prettyLocal(phones[0])}</a></>}.
        </p>
      )}
      {formError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{formError}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-56" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</> : 'Request a ride'}
        </button>
        <p className="text-xs text-night/55">Our team confirms every booking by phone or WhatsApp.</p>
      </div>
    </form>
  );
}
