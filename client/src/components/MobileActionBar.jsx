import { Link, useLocation } from 'react-router-dom';
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';

/** Always-visible call / WhatsApp / book bar on phones. */
export default function MobileActionBar({ theme = 'dark' }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const isLight = theme === 'light';
  const { primaryPhone, primaryWhatsApp, tel, wa } = useSettings();
  const base = `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 font-display text-[11px] font-extrabold uppercase tracking-wide ${isLight ? 'text-night' : 'text-white'}`;
  return (
    <nav className={`fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden ${isLight ? 'border-night/10 bg-white' : isHome ? 'home-mobile-bar border-amber-400/40 bg-[#071018]' : 'border-leaf/40 bg-night'}`} aria-label="Quick actions">
      <div className="flex divide-x divide-white/10">
        {primaryPhone && (
          <a href={tel(primaryPhone)} className={base}>
            <Phone className={`h-5 w-5 ${isHome ? 'text-amber-400' : 'text-lime'}`} aria-hidden="true" /> Call
          </a>
        )}
        {primaryWhatsApp && (
          <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride, I would like to book a ride.')} target="_blank" rel="noopener noreferrer" className={base}>
            <MessageCircle className={`h-5 w-5 ${isHome ? 'text-amber-400' : 'text-lime'}`} aria-hidden="true" /> WhatsApp
          </a>
        )}
        <Link to="/booking" className={`${base} ${isHome ? 'bg-amber-400 text-night' : 'bg-leaf text-night'}`}>
          <CalendarCheck className="h-5 w-5" aria-hidden="true" /> Book ride
        </Link>
      </div>
    </nav>
  );
}
