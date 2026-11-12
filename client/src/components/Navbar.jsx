import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Phone, Sun, X } from 'lucide-react';
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

export default function Navbar({ theme = 'dark', onToggleTheme = () => {} }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  const homeTheme = onHome ? 'home-navbar' : '';
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
  const lightHeader = theme === 'light' || light;
  const link = ({ isActive }) =>
    `relative px-1 py-2 text-sm font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:transition-transform hover:after:scale-x-100 ${onHome ? 'after:bg-amber-400' : 'after:bg-leaf'} ${isActive ? (onHome ? 'text-amber-300 after:scale-x-100' : lightHeader ? 'text-moss' : 'text-lime') : (lightHeader ? 'text-night/75 hover:text-night' : 'text-white/85 hover:text-white')}`;

  return (
    <header className={`${homeTheme} fixed inset-x-0 top-0 z-40 transition-all duration-300 ${lightHeader ? 'bg-white/95 shadow-sm backdrop-blur' : solid ? 'bg-night shadow-[0_8px_24px_-12px_rgba(0,0,0,.6)]' : 'bg-gradient-to-b from-night/80 to-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <Logo tone={lightHeader ? 'dark' : 'light'} size={scrolled ? 38 : 44} />

        <nav className="hidden items-center gap-6 xl:gap-7 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={link}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {primaryPhone && (
            <a href={tel(primaryPhone)} className={`hidden items-center gap-2 text-sm font-bold xl:flex ${lightHeader ? 'text-night' : 'text-white'}`} aria-label={`Call ${primaryPhone}`}>
              <Phone className={`h-4 w-4 ${lightHeader ? 'text-moss' : 'text-lime'}`} aria-hidden="true" /> {prettyLocal(primaryPhone)}
            </a>
          )}
          <button type="button" onClick={onToggleTheme} className={`grid h-10 w-10 place-items-center rounded-full border transition ${lightHeader ? 'border-night/15 text-night hover:bg-night/5' : 'border-white/25 text-white hover:bg-white/10'}`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <Link to="/booking" className={`btn btn-sm hidden sm:inline-flex ${onHome ? 'bg-amber-400 text-night hover:bg-amber-300' : 'btn-primary'}`}>Book a ride</Link>
          <button
            type="button"
            className={`grid h-11 w-11 place-items-center rounded-full border lg:hidden ${lightHeader ? 'border-night/20 text-night' : 'border-white/25 text-white'}`}
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
            <Link to="/booking" className={`btn mt-6 w-full ${onHome ? 'bg-amber-400 text-night hover:bg-amber-300' : 'btn-primary'}`}>Book a ride</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
