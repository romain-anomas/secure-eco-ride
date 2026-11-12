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
    <footer className="bg-night text-white">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo size={48} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">{settings.company_description}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map(([k, url]) => (
                <li key={k}><a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-lime hover:text-lime">{SOCIAL_LABELS[k] || k}</a></li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Services">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-lime">Services</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li><Link className="hover:text-white" to="/services">Local &amp; long distance rides</Link></li>
            <li><Link className="hover:text-white" to="/airport-transfers">Airport transfers</Link></li>
            <li><Link className="hover:text-white" to="/corporate">Corporate &amp; private travel</Link></li>
            <li><Link className="hover:text-white" to="/fleet">Our fleet</Link></li>
          </ul>
        </nav>

        <nav aria-label="Quick links">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-lime">Quick links</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li><Link className="hover:text-white" to="/booking">Book a ride</Link></li>
            <li><Link className="hover:text-white" to="/about">About us</Link></li>
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
            <li><Link className="hover:text-white" to="/privacy">Privacy policy</Link></li>
            <li><Link className="hover:text-white" to="/terms">Terms &amp; conditions</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-lime">Call or message us</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {phones.map((p) => (
              <li key={p}><a href={tel(p)} className="inline-flex items-center gap-2 font-semibold hover:text-lime"><Phone className="h-4 w-4 text-lime" aria-hidden="true" />{prettyLocal(p)}</a></li>
            ))}
            {whatsappNumbers[0] && (
              <li><a href={wa(whatsappNumbers[0], 'Hello Secure Eco Ride')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold hover:text-lime"><MessageCircle className="h-4 w-4 text-lime" aria-hidden="true" />WhatsApp us</a></li>
            )}
            {settings.email && <li><a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 text-white/75 hover:text-white"><Mail className="h-4 w-4 text-lime" aria-hidden="true" />{settings.email}</a></li>}
            {settings.address && <li className="flex items-start gap-2 text-white/75"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />{settings.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-leaf/40 bg-coal">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-display text-sm font-extrabold uppercase tracking-wider text-lime">Safe rides • Cleaner planet • Better tomorrow</p>
          <p className="text-xs text-white/55">© {new Date().getFullYear()} {settings.company_name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
