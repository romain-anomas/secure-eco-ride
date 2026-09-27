import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { post, parseError } from '../services/api.js';

const EMPTY = { name: '', company: '', phone: '', email: '', message: '', website: '' };

export default function CorporateForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { ...form, type: 'CORPORATE' };
      Object.keys(payload).forEach((k) => payload[k] === '' && delete payload[k]);
      const res = await post('/contact', payload);
      setDone(res.data.message);
      setForm(EMPTY);
    } catch (err) {
      const p = parseError(err);
      setErrors(p.fields);
      setError(p.message);
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <div className="text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-moss" aria-hidden="true" />
        <h3 className="mt-4 font-display text-2xl font-black uppercase">Request received</h3>
        <p className="mt-2 text-night/70">{done}</p>
        <button type="button" className="btn btn-outline mt-6" onClick={() => setDone('')}>Send another request</button>
      </div>
    );
  }

  const cls = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <form onSubmit={submit} noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="cf-name" className="label">Contact person</label><input id="cf-name" className={cls('name')} value={form.name} onChange={set('name')} autoComplete="name" required />{errors.name && <p className="field-error">{errors.name}</p>}</div>
        <div><label htmlFor="cf-company" className="label">Company / organisation</label><input id="cf-company" className={cls('company')} value={form.company} onChange={set('company')} autoComplete="organization" />{errors.company && <p className="field-error">{errors.company}</p>}</div>
        <div><label htmlFor="cf-phone" className="label">Phone</label><input id="cf-phone" type="tel" inputMode="tel" className={cls('phone')} value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="07XX XXX XXX" />{errors.phone && <p className="field-error">{errors.phone}</p>}</div>
        <div><label htmlFor="cf-email" className="label">Email</label><input id="cf-email" type="email" className={cls('email')} value={form.email} onChange={set('email')} autoComplete="email" />{errors.email && <p className="field-error">{errors.email}</p>}</div>
        <div className="sm:col-span-2"><label htmlFor="cf-message" className="label">What do you need?</label><textarea id="cf-message" rows={4} className={cls('message')} value={form.message} onChange={set('message')} placeholder="Regular staff transport, hotel guests, an event, executive travel…" required />{errors.message && <p className="field-error">{errors.message}</p>}</div>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={busy}>
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…</> : 'Request corporate service'}
      </button>
    </form>
  );
}
