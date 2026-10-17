import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { api, get, parseError, post, put, resolveAssetUrl } from '../../services/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ErrorBox, PageHeader, Spinner } from '../../components/admin/ui.jsx';
import ImagePreview from '../../components/admin/ImagePreview.jsx';

const lines = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');
const toList = (s) => String(s).split(/\n|,/).map((x) => x.trim()).filter(Boolean);
const SOCIAL = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

function Card({ title, children, hint }) {
  return <section className="admin-card"><h2 className="font-display text-lg font-black uppercase">{title}</h2>{hint && <p className="mt-1 text-sm text-night/60">{hint}</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></section>;
}
const F = ({ label, hint, wide, children }) => <div className={wide ? 'sm:col-span-2' : ''}><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-night/55">{hint}</p>}</div>;

function ImageField({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function upload(file) {
    if (!file) return;
    setBusy(true); setErr('');
    try { const fd = new FormData(); fd.append('image', file); onChange(resolveAssetUrl((await api.post('/uploads', fd)).data.data.url)); }
    catch (e) { setErr(parseError(e).message); } finally { setBusy(false); }
  }
  return (
    <F label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        {value && <ImagePreview src={value} className="h-16 max-w-[8rem] rounded-lg border border-night/10 bg-night/5 object-contain" />}
        <label className="btn btn-outline btn-sm cursor-pointer"><Upload className="h-4 w-4" aria-hidden="true" /> {busy ? 'Uploading…' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} /></label>
        {value && <button type="button" className="text-sm font-semibold text-red-600" onClick={() => onChange('')}>Remove</button>}
      </div>
      {err && <p className="field-error">{err}</p>}
    </F>
  );
}

export default function Settings() {
  const { refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    get('/settings').then((r) => {
      const d = r.data;
      setForm({ ...d, phone_numbers: lines(d.phone_numbers), whatsapp_numbers: lines(d.whatsapp_numbers), social_links: { facebook: '', instagram: '', twitter: '', tiktok: '', youtube: '', ...(d.social_links || {}) } });
    }).catch((e) => setError(parseError(e).message));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMsg('');
    try {
      await put('/settings', { ...form, phone_numbers: toList(form.phone_numbers), whatsapp_numbers: toList(form.whatsapp_numbers) });
      await refresh();
      setMsg('Settings saved. The website now uses them.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { const p = parseError(err); setError(Object.values(p.fields)[0] || p.message); } finally { setBusy(false); }
  }

  async function changePw(e) {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    try { await post('/auth/change-password', pw); setPwMsg('Password changed.'); setPw({ current_password: '', new_password: '' }); }
    catch (err) { setPwErr(parseError(err).message); }
  }

  if (!form) return error ? <ErrorBox>{error}</ErrorBox> : <Spinner />;
  return (
    <>
      <PageHeader title="Settings" subtitle="Everything customers see about the company. Empty fields are simply hidden on the website." />
      {msg && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{msg}</p>}
      <ErrorBox>{error}</ErrorBox>
      <form onSubmit={save} className="mt-2 space-y-6">
        <Card title="Company">
          <F label="Company name"><input className="input" value={form.company_name} onChange={set('company_name')} /></F>
          <F label="Slogan"><input className="input" value={form.slogan} onChange={set('slogan')} /></F>
          <F label="Secondary line (hero text)" wide><input className="input" value={form.tagline} onChange={set('tagline')} /></F>
          <F label="Short description" hint="Used in the footer and search results." wide><textarea rows={2} className="input" value={form.company_description} onChange={set('company_description')} /></F>
          <F label="About text" hint="Shown on the About page. Only write what is true — separate paragraphs with a blank line." wide><textarea rows={6} className="input" value={form.about_text} onChange={set('about_text')} /></F>
        </Card>

        <Card title="Contact" hint="Phone numbers can be typed as 0793157373 — they are converted to +250… automatically.">
          <F label="Phone numbers (one per line)"><textarea rows={4} className="input" value={form.phone_numbers} onChange={set('phone_numbers')} /></F>
          <F label="WhatsApp numbers (one per line)" hint="Used for website WhatsApp buttons. If WHATSAPP_RECIPIENT_* are set on the server, those receive booking alerts instead."><textarea rows={4} className="input" value={form.whatsapp_numbers} onChange={set('whatsapp_numbers')} /></F>
          <F label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></F>
          <F label="Business hours"><textarea rows={2} className="input" value={form.business_hours} onChange={set('business_hours')} /></F>
          <F label="Address" wide><textarea rows={2} className="input" value={form.address} onChange={set('address')} placeholder="Add your office address when you have one" /></F>
          <F label="Service areas" wide><textarea rows={2} className="input" value={form.service_areas} onChange={set('service_areas')} /></F>
        </Card>

        <Card title="Social media">
          {SOCIAL.map((k) => <F key={k} label={k[0].toUpperCase() + k.slice(1)}><input type="url" className="input" placeholder="https://…" value={form.social_links[k]} onChange={(e) => setForm((f) => ({ ...f, social_links: { ...f.social_links, [k]: e.target.value } }))} /></F>)}
        </Card>

        <Card title="Branding" hint="If you have no logo or hero photo yet, the built-in emblem and illustration are used.">
          <ImageField label="Logo" value={form.logo_url} onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))} hint="Transparent PNG or WebP works best." />
          <ImageField label="Hero image" value={form.hero_image_url} onChange={(v) => setForm((f) => ({ ...f, hero_image_url: v }))} hint="A wide, high-quality vehicle photo (WebP/AVIF, under 4 MB)." />
        </Card>

        <Card title="Prices">
          <label className="flex items-start gap-3 sm:col-span-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--c-green))]" checked={Boolean(form.show_prices)} onChange={set('show_prices')} /><span><span className="block text-sm font-semibold">Show prices on the website</span><span className="text-xs text-night/55">Off = quotation-based. When on, active rules from Pricing appear on service cards.</span></span></label>
          <F label="Currency"><input className="input" value={form.currency} onChange={set('currency')} /></F>
        </Card>

        <div className="sticky bottom-16 z-10 flex justify-end lg:bottom-4"><button type="submit" className="btn btn-primary shadow-lg" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
      </form>

      <form onSubmit={changePw} className="admin-card mt-10 max-w-xl">
        <h2 className="font-display text-lg font-black uppercase">Change your password</h2>
        <div className="mt-4 grid gap-4">
          <F label="Current password"><input type="password" className="input" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} required /></F>
          <F label="New password" hint="At least 10 characters."><input type="password" className="input" autoComplete="new-password" minLength={10} value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} required /></F>
        </div>
        {pwMsg && <p className="mt-3 text-sm font-medium text-green-800" role="status">{pwMsg}</p>}
        <ErrorBox>{pwErr}</ErrorBox>
        <button type="submit" className="btn btn-dark btn-sm mt-4">Change password</button>
      </form>
    </>
  );
}
