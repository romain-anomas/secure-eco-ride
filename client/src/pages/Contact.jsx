import { useState } from 'react';
import { CheckCircle2, Clock, Loader2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';
import { post, parseError } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import PageHero from '../components/PageHero.jsx';
import { normalizePhone, prettyLocal } from '../utils/phone.js';
import PhoneInput from '../components/PhoneInput.jsx';
import { DEFAULT_PHONE_COUNTRY } from '../utils/phoneCountries.js';

const EMPTY = { name: '', phone: '', email: '', message: '', website: '' };

function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_PHONE_COUNTRY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    if (form.phone.trim() && !normalizePhone(form.phone, phoneCountryCode)) {
      setErrors((e) => ({ ...e, phone: 'Enter a valid phone number for the selected country' }));
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form, phone: form.phone.trim() ? normalizePhone(form.phone, phoneCountryCode) : '', type: 'GENERAL' };
      Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
      const res = await post('/contact', payload);
      setDone(res.data.message); setForm(EMPTY);
    } catch (err) { const p = parseError(err); setErrors(p.fields); setError(p.message); } finally { setBusy(false); }
  }

  if (done) return (
    <div className="text-center" role="status">
      <CheckCircle2 className="mx-auto h-12 w-12 text-moss" aria-hidden="true" />
      <p className="mt-4 font-display text-2xl font-black uppercase">Message sent</p>
      <p className="mt-2 text-night/70">{done}</p>
      <button className="btn btn-outline mt-6" type="button" onClick={() => setDone('')}>Send another message</button>
    </div>
  );

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <form onSubmit={submit} noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Your name</label><input id="c-name" className={cls('name')} value={form.name} onChange={set('name')} autoComplete="name" required />{errors.name && <p className="field-error">{errors.name}</p>}</div>
        <div><label className="label" htmlFor="c-phone">Phone</label><PhoneInput id="c-phone" value={form.phone} onChange={(value) => { setForm((f) => ({ ...f, phone: value })); setErrors((e) => ({ ...e, phone: undefined })); }} countryCode={phoneCountryCode} onCountryCodeChange={(value) => { setPhoneCountryCode(value); setErrors((e) => ({ ...e, phone: undefined })); }} error={errors.phone} placeholder="e.g. 793 157 373" />{errors.phone && <p id="c-phone-error" className="field-error">{errors.phone}</p>}</div>
        <div className="sm:col-span-2"><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" className={cls('email')} value={form.email} onChange={set('email')} autoComplete="email" />{errors.email && <p className="field-error">{errors.email}</p>}</div>
        <div className="sm:col-span-2"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" rows={5} className={cls('message')} value={form.message} onChange={set('message')} required />{errors.message && <p className="field-error">{errors.message}</p>}</div>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <p className="mt-3 text-xs text-night/55">Add a phone number or an email so we can reply.</p>
      <button type="submit" className="btn btn-primary mt-5" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</> : 'Send message'}</button>
    </form>
  );
}

export default function Contact() {
  useSeo({ title: 'Contact | Secure Eco Ride', description: 'Call, WhatsApp or message Secure Eco Ride to book a taxi or ask about airport transfers and corporate travel.' });
  const { settings, phones, primaryWhatsApp, tel, wa } = useSettings();
  return (
    <>
      <PageHero title="Contact us" intro="Call, message on WhatsApp, or send us a note — we reply quickly." />
      <section className="section bg-mist">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-5">
            <div className="rounded-3xl bg-night p-6 text-white sm:p-8">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">Call us</h2>
              <ul className="mt-4 space-y-3">
                {phones.map((p) => <li key={p}><a href={tel(p)} className="inline-flex items-center gap-3 font-display text-2xl font-black hover:text-lime"><Phone className="h-5 w-5 text-lime" aria-hidden="true" />{prettyLocal(p)}</a></li>)}
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {phones[0] && <a href={tel(phones[0])} className="btn btn-primary">Call now</a>}
                {primaryWhatsApp && <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride')} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</a>}
                <Link to="/booking" className="btn btn-outline-light">Book a ride</Link>
              </div>
            </div>
            {(settings.email || settings.address || settings.business_hours) && (
              <ul className="space-y-4 rounded-3xl bg-white p-6 shadow-card">
                {settings.email && <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /><a href={`mailto:${settings.email}`} className="font-semibold hover:underline">{settings.email}</a></li>}
                {settings.address && <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /><span className="whitespace-pre-line">{settings.address}</span></li>}
                {settings.business_hours && <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /><span className="whitespace-pre-line">{settings.business_hours}</span></li>}
              </ul>
            )}
          </div>
          <div className="rounded-[2rem] border-t-4 border-leaf bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight">Send a message</h2>
            <div className="mt-5"><ContactForm /></div>
          </div>
        </div>
      </section>
    </>
  );
}
