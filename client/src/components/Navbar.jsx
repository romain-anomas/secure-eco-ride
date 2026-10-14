import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Phone, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

export const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/airport-transfers', label: 'Airport Transfers' },
  { to: '/corporate', label: 'Corporate' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { primaryPhone, tel } = useSettings();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const solid = scrolled || open;
  const light = scrolled && !open;
  const link = ({ isActive }) =>
    `relative px-1 py-2 text-sm font-semibold transition-colors ${isActive ? (light ? 'text-moss' : 'text-lime') : (light ? 'text-night/75 hover:text-night' : 'text-white/85 hover:text-white')}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${light ? 'bg-white/95 shadow-sm backdrop-blur' : solid ? 'bg-night shadow-[0_8px_24px_-12px_rgba(0,0,0,.6)]' : 'bg-gradient-to-b from-night/80 to-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <Logo tone={light ? 'dark' : 'light'} size={scrolled ? 38 : 44} />

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={link}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {primaryPhone && (
            <a href={tel(primaryPhone)} className={`hidden items-center gap-2 text-sm font-bold xl:flex ${light ? 'text-night' : 'text-white'}`} aria-label={`Call ${primaryPhone}`}>
              <Phone className={`h-4 w-4 ${light ? 'text-moss' : 'text-lime'}`} aria-hidden="true" /> {prettyLocal(primaryPhone)}
            </a>
          )}
          <Link to="/booking" className="btn btn-primary btn-sm hidden sm:inline-flex">Book a ride</Link>
          <button
            type="button"
            className={`grid h-11 w-11 place-items-center rounded-full border lg:hidden ${light ? 'border-night/20 text-night' : 'border-white/25 text-white'}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-night px-4 pb-28 pt-4 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ul className="divide-y divide-white/10">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} end={l.end} className={({ isActive }) => `block rounded-xl px-3 py-3 font-sans text-lg font-semibold transition-colors hover:bg-white/5 sm:text-xl ${isActive ? 'bg-white/10 text-lime' : 'text-white/90'}`}>
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/booking" className="btn btn-primary mt-6 w-full">Book a ride</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
