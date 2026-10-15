import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/admin/ui.jsx';
import Logo from '../components/Logo.jsx';

export default function DriverLayout() {
  const { user, checking, logout } = useAuth();
  const location = useLocation();
  if (checking) return <div className="grid min-h-screen place-items-center bg-mist"><Spinner label="Checking your session…" /></div>;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'DRIVER') return <Navigate to="/admin" replace />;
  return <div className="min-h-screen bg-mist">
    <header className="sticky top-0 z-20 border-b border-night/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><Logo size={38} to="/driver" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-night/45">Driver portal</p><p className="truncate font-bold">{user.name}</p></div></div>
        <div className="flex items-center gap-2"><Link className="btn btn-outline btn-sm hidden sm:inline-flex" to="/">Website</Link><button type="button" className="btn btn-outline btn-sm" onClick={logout}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button></div>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10"><Outlet /></main>
  </div>;
}
