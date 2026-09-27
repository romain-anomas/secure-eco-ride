import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { get, post, parseError } from '../services/api.js';
import { normalizePhone } from '../utils/phone.js';
import { todayISO } from '../utils/format.js';
import { DEFAULT_SERVICES } from '../utils/defaults.js';
import BookingConfirmation from './BookingConfirmation.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

const EMPTY = {
  customer_name: '', phone: '', email: '', pickup_location: '', destination: '', pickup_date: '', pickup_time: '',
  passengers: '1', service_id: '', vehicle_type: '', notes: '', flight_number: '', airport_direction: '', airport_name: '',
  luggage_count: '', website: '',
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
 *       'full'    booking page (adds email, vehicle type, notes; airport fields appear for airport service)
 *       'airport' airport page (airport fields always shown, airport service preselected)
 */
export default function BookingForm({ mode = 'full', defaultServiceSlug }) {
  const [params] = useSearchParams();
  const { phones, tel } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesFailed, setServicesFailed] = useState(false);
  const [categories, setCategories] = useState([]);
  const topRef = useRef(null);

  useEffect(() => {
    let alive = true;
    get('/services')
      .then((r) => alive && setServices(r.data.filter((s) => s.is_bookable)))
      .catch(() => { if (alive) { setServicesFailed(true); setServices(DEFAULT_SERVICES.filter((s) => s.is_bookable)); } });
    if (mode !== 'quick') {
      get('/fleet').then((r) => alive && setCategories([...new Set(r.data.map((v) => v.category))])).catch(() => {});
    }
    return () => { alive = false; };
  }, [mode]);

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
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  function validate() {
    const e = {};
    if (form.customer_name.trim().length < 2) e.customer_name = 'Enter your name';
    if (!normalizePhone(form.phone)) e.phone = 'Enter a valid phone number, e.g. 0793157373';
    if (form.pickup_location.trim().length < 2) e.pickup_location = 'Enter the pickup location';
    if (form.destination.trim().length < 2) e.destination = 'Enter the destination';
    if (!form.pickup_date) e.pickup_date = 'Choose a date';
    else if (form.pickup_date < today) e.pickup_date = 'The date cannot be in the past';
    if (!form.pickup_time) e.pickup_time = 'Choose a time';
    if (!(Number(form.passengers) >= 1)) e.passengers = 'At least 1 passenger';
    if (!form.service_id) e.service_id = 'Choose a service';
    return e;
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`bf-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    const payload = { ...form, passengers: Number(form.passengers), service_id: Number(form.service_id) };
    if (!showAirport) ['flight_number', 'airport_direction', 'airport_name', 'luggage_count'].forEach((k) => delete payload[k]);
    Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);

    setSubmitting(true);
    try {
      const res = await post('/bookings', payload);
      setResult(res.data);
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

  if (result) return <div ref={topRef}><BookingConfirmation result={result} onReset={() => setResult(null)} /></div>;

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
        <Field id="bf-pickup_location" label="Pickup location" error={errors.pickup_location}>
          <input id="bf-pickup_location" className={inputCls('pickup_location')} value={form.pickup_location} onChange={set('pickup_location')} placeholder="Where should we pick you up?" autoComplete="street-address" {...aria('pickup_location')} />
        </Field>
        <Field id="bf-destination" label="Destination" error={errors.destination}>
          <input id="bf-destination" className={inputCls('destination')} value={form.destination} onChange={set('destination')} placeholder="Where are you going?" {...aria('destination')} />
        </Field>
        <Field id="bf-pickup_date" label="Date" error={errors.pickup_date}>
          <input id="bf-pickup_date" type="date" min={today} className={inputCls('pickup_date')} value={form.pickup_date} onChange={set('pickup_date')} {...aria('pickup_date')} />
        </Field>
        <Field id="bf-pickup_time" label="Time" error={errors.pickup_time}>
          <input id="bf-pickup_time" type="time" className={inputCls('pickup_time')} value={form.pickup_time} onChange={set('pickup_time')} {...aria('pickup_time')} />
        </Field>
        <Field id="bf-passengers" label="Passengers" error={errors.passengers}>
          <input id="bf-passengers" type="number" min="1" max="50" inputMode="numeric" className={inputCls('passengers')} value={form.passengers} onChange={set('passengers')} {...aria('passengers')} />
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
          <input id="bf-phone" type="tel" inputMode="tel" className={inputCls('phone')} value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="07XX XXX XXX" {...aria('phone')} />
        </Field>

        {mode !== 'quick' && (
          <>
            <Field id="bf-email" label="Email (optional)" error={errors.email}>
              <input id="bf-email" type="email" className={inputCls('email')} value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" {...aria('email')} />
            </Field>
            {categories.length > 0 && (
              <Field id="bf-vehicle_type" label="Vehicle type (optional)" error={errors.vehicle_type}>
                <select id="bf-vehicle_type" className={inputCls('vehicle_type')} value={form.vehicle_type} onChange={set('vehicle_type')}>
                  <option value="">No preference</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            )}
          </>
        )}

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
              <input id="bf-luggage_count" type="number" min="0" max="50" inputMode="numeric" className={inputCls('luggage_count')} value={form.luggage_count} onChange={set('luggage_count')} />
            </Field>
          </>
        )}

        {mode !== 'quick' && (
          <Field id="bf-notes" label="Special requests (optional)" error={errors.notes} className="sm:col-span-2">
            <textarea id="bf-notes" rows={3} className={inputCls('notes')} value={form.notes} onChange={set('notes')} placeholder="Child seat, extra stop, accessibility needs…" maxLength={1000} />
          </Field>
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
