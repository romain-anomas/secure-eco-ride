import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from 'simple-icons';
import Logo from './Logo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

const SOCIAL_BRANDS = {
  facebook: { label: 'Facebook', icon: siFacebook },
  instagram: { label: 'Instagram', icon: siInstagram },
  twitter: { label: 'X', icon: siX },
  tiktok: { label: 'TikTok', icon: siTiktok },
  youtube: { label: 'YouTube', icon: siYoutube },
};

export default function Footer() {
  const { settings, phones, whatsappNumbers, tel, wa } = useSettings();
  const socials = Object.entries(SOCIAL_BRANDS).filter(([key]) => settings.social_links?.[key]);
  return (
    <footer className="border-t border-night/10 bg-white text-night">
      <div className="container-x grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:py-14">
        <div>
          <Logo tone="dark" size={48} forceBrandMark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-night/65">{settings.company_description}</p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map(([key, { label, icon }]) => (
              <li key={key}><a href={settings.social_links[key]} target="_blank" rel="noopener noreferrer" aria-label={`Visit Secure Eco Ride on ${label}`} title={label} className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-night/10 bg-white px-3 py-2 text-xs font-bold text-night/75 shadow-sm transition hover:-translate-y-0.5 hover:border-night/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2" style={{ '--social-color': `#${icon.hex}` }}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110" fill="var(--social-color)"><path d={icon.path} transform="translate(1 1) scale(.92)" /></svg><span>{label}</span></a></li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:col-span-2 lg:col-span-1">
          <nav aria-label="Services">
            <h2 className="font-display text-sm font-extrabold text-emerald-800">Services</h2>
            <ul className="mt-4 space-y-1.5 text-sm text-night/70">
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/services">Local &amp; long distance rides<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/airport-transfers">Airport transfers<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/corporate">Corporate &amp; private travel<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/fleet">Our fleet<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
            </ul>
          </nav>

          <nav aria-label="Quick links">
            <h2 className="font-display text-sm font-extrabold text-emerald-800">Quick links</h2>
            <ul className="mt-4 space-y-1.5 text-sm text-night/70">
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/booking">Book a ride<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/about">About us<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/contact">Contact<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/privacy">Privacy policy<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
              <li><Link className="group flex min-h-9 items-center justify-between gap-2 rounded-lg py-1 transition hover:text-emerald-800" to="/terms">Terms &amp; conditions<ArrowRight className="h-3.5 w-3.5 shrink-0 text-emerald-700 transition group-hover:translate-x-1" aria-hidden="true" /></Link></li>
            </ul>
          </nav>
        </div>

        <div className="sm:col-start-2 sm:row-start-1 lg:col-start-auto lg:row-start-auto">
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
