import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import Logo from './Logo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

const SOCIAL_LABELS = { facebook: 'Facebook', instagram: 'Instagram', twitter: 'X / Twitter', tiktok: 'TikTok', youtube: 'YouTube' };

export default function Footer() {
  const { settings, phones, whatsappNumbers, tel, wa } = useSettings();
  const socials = Object.entries(settings.social_links || {}).filter(([, v]) => v);
  return (
    <footer className="border-t border-night/10 bg-white text-night">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="dark" size={48} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-night/65">{settings.company_description}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map(([k, url]) => (
              <li key={k}><a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-night/15 px-3 py-1.5 text-xs font-semibold text-night/75 transition hover:border-emerald-600 hover:text-emerald-800">{SOCIAL_LABELS[k] || k}</a></li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Services">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-emerald-800">Services</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-night/70">
            <li><Link className="transition hover:text-emerald-800" to="/services">Local &amp; long distance rides</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/airport-transfers">Airport transfers</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/corporate">Corporate &amp; private travel</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/fleet">Our fleet</Link></li>
          </ul>
        </nav>

        <nav aria-label="Quick links">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-emerald-800">Quick links</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-night/70">
            <li><Link className="transition hover:text-emerald-800" to="/booking">Book a ride</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/about">About us</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/contact">Contact</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/privacy">Privacy policy</Link></li>
            <li><Link className="transition hover:text-emerald-800" to="/terms">Terms &amp; conditions</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-emerald-800">Call or message us</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {phones.map((p) => (
              <li key={p}><a href={tel(p)} className="inline-flex items-center gap-2 font-semibold text-night/80 transition hover:text-emerald-800"><Phone className="h-4 w-4 text-emerald-700" aria-hidden="true" />{prettyLocal(p)}</a></li>
            ))}
            {whatsappNumbers[0] && (
              <li><a href={wa(whatsappNumbers[0], 'Hello Secure Eco Ride')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-night/80 transition hover:text-emerald-800"><MessageCircle className="h-4 w-4 text-emerald-700" aria-hidden="true" />WhatsApp us</a></li>
            )}
            {settings.email && <li><a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 text-night/70 transition hover:text-emerald-800"><Mail className="h-4 w-4 text-sky-700" aria-hidden="true" />{settings.email}</a></li>}
            {settings.address && <li className="flex items-start gap-2 text-night/70"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />{settings.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-night/10 bg-[#f4f7f5]">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-emerald-800">Safe rides • Cleaner planet • Better tomorrow</p>
          <p className="text-xs text-night/55">© {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
