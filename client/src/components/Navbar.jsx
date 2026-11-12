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
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';
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

  const link = ({ isActive }) =>
    `relative px-1 py-2 text-sm font-semibold text-night/75 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:transition-transform hover:text-night hover:after:scale-x-100 ${onHome ? 'after:bg-amber-400' : 'after:bg-leaf'} ${isActive ? (onHome ? 'text-amber-700 after:scale-x-100' : 'text-moss') : ''}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-night/10 bg-white/95 shadow-[0_8px_30px_-22px_rgba(16,27,24,.35)] backdrop-blur-xl transition-all duration-300">
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <Logo tone="dark" size={scrolled ? 38 : 44} />

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={link}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {primaryPhone && (
            <a href={tel(primaryPhone)} className="hidden items-center gap-2 text-sm font-bold text-night xl:flex" aria-label={`Call ${primaryPhone}`}>
              <Phone className="h-4 w-4 text-moss" aria-hidden="true" /> {prettyLocal(primaryPhone)}
            </a>
          )}
          <Link to="/booking" className={`btn btn-sm hidden sm:inline-flex ${onHome ? 'bg-amber-400 text-night hover:bg-amber-300' : 'btn-primary'}`}>Book a ride</Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-night/15 bg-white text-night transition hover:border-emerald-700 hover:bg-emerald-50 lg:hidden"
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
            className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-night/10 bg-white px-4 pb-28 pt-4 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <ul className="divide-y divide-night/10">
              {NAV_LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink to={l.to} end={l.end} className={({ isActive }) => `block rounded-xl px-3 py-3 font-sans text-lg font-semibold text-night/80 transition-colors hover:bg-mist sm:text-xl ${isActive ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <Link to="/booking" className={`btn mt-6 w-full ${onHome ? 'bg-amber-400 text-night hover:bg-amber-300' : 'btn-primary'}`}>Book a ride</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
