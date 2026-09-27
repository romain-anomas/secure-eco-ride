import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Bell, Car, ClipboardList, LayoutDashboard, LogOut, Menu, MessageCircle, MessageSquare, Settings, Tag, Truck, UserCheck, Users, X, Star, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { get } from '../services/api.js';
import Logo from '../components/Logo.jsx';
import { Spinner } from '../components/admin/ui.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/drivers', label: 'Drivers', icon: UserCheck },
  { to: '/admin/vehicles', label: 'Vehicles', icon: Car, admin: true },
  { to: '/admin/services', label: 'Services', icon: Truck, admin: true },
  { to: '/admin/pricing', label: 'Pricing', icon: Tag, admin: true },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Star, admin: true },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/whatsapp', label: 'WhatsApp logs', icon: MessageCircle },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/users', label: 'Team accounts', icon: KeyRound, admin: true },
  { to: '/admin/settings', label: 'Settings', icon: Settings, admin: true },
];

export default function AdminLayout() {
  const { user, checking, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(0);
  const [banner, setBanner] = useState('');
  const last = useRef(null);

  useEffect(() => setOpen(false), [pathname]);

  // Poll for new website bookings (the in-dashboard notification)
  useEffect(() => {
    if (!user) return undefined;
    let stop = false;
    const tick = async () => {
      try {
        const { data } = await get('/bookings/unseen-count');
        if (stop) return;
        setUnseen(data.count);
        if (last.current !== null && data.count > last.current) setBanner(`${data.count - last.current} new booking${data.count - last.current === 1 ? '' : 's'} received`);
        last.current = data.count;
      } catch { /* ignore transient errors */ }
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => { stop = true; clearInterval(t); };
  }, [user]);

  if (checking) return <div className="grid min-h-screen place-items-center bg-mist"><Spinner label="Checking your session…" /></div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;

  const links = NAV.filter((n) => !n.admin || isAdmin);
  const sidebar = (
    <nav className="flex h-full flex-col bg-night text-white" aria-label="Admin">
      <div className="flex h-16 items-center justify-between px-5"><Logo size={36} to="/admin" /><button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
      <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-leaf text-night' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" /> {label}
              {to === '/admin/bookings' && unseen > 0 && <span className="ml-auto rounded-full bg-lime px-2 py-0.5 text-xs font-black text-night">{unseen}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/10 p-4 text-sm">
        <p className="truncate font-semibold">{user.name}</p>
        <p className="truncate text-xs text-white/55">{user.email} · {user.role}</p>
        <div className="mt-3 flex gap-2">
          <Link to="/" className="btn btn-outline-light btn-sm flex-1">View site</Link>
          <button type="button" onClick={logout} className="btn btn-outline-light btn-sm" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-mist lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-night/60" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 max-w-[85%]">{sidebar}</aside></div>}

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-night/10 bg-white/90 px-4 backdrop-blur lg:px-8">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-night/15 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <span className="hidden text-sm text-night/60 lg:block">Secure Eco Ride · Admin</span>
        <Link to="/admin/bookings" className="relative grid h-10 w-10 place-items-center rounded-full border border-night/15 hover:border-leaf" aria-label={`${unseen} new bookings`}>
          <Bell className="h-5 w-5" />{unseen > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[11px] font-black text-night">{unseen}</span>}
        </Link>
      </header>

      {banner && (
        <div className="flex items-center justify-between gap-3 bg-leaf px-4 py-2.5 text-sm font-bold text-night lg:px-8" role="status">
          <Link to="/admin/bookings" onClick={() => setBanner('')} className="underline">{banner} — open bookings</Link>
          <button type="button" onClick={() => setBanner('')} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}
      <main className="p-4 lg:p-8"><Outlet /></main>
    </div>
  );
}
