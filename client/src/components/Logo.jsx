import { Link } from 'react-router-dom';
import LogoMark from './art/LogoMark.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

/** Uses the uploaded logo (Admin → Settings) when available, otherwise the built-in emblem + wordmark. */
export default function Logo({ tone = 'light', size = 44, to = '/', className = '' }) {
  const { settings } = useSettings();
  const first = tone === 'light' ? 'text-white' : 'text-night';
  return (
    <Link to={to} className={`inline-flex items-center gap-3 ${className}`} aria-label={`${settings.company_name} — home`}>
      {settings.logo_url ? (
        <img src={settings.logo_url} alt="" style={{ height: size }} className="w-auto max-w-[180px] object-contain" />
      ) : (
        <>
          <LogoMark size={size} />
          <span className="font-display font-black uppercase leading-[0.86] tracking-tight" style={{ fontSize: size * 0.42 }}>
            <span className={`block ${first}`}>Secure</span>
            <span className="block text-leaf">Eco Ride</span>
          </span>
        </>
      )}
    </Link>
  );
}
