import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/admin/ui.jsx';
import Logo from '../components/Logo.jsx';
import DriverPushControls from '../components/driver/DriverPushControls.jsx';
import PushAlertSheet from '../components/PushAlertSheet.jsx';
import { listenForFcmMessages, showFcmNotification } from '../services/firebaseMessaging.js';

export default function DriverLayout() {
  const { user, checking, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    if (user?.role !== 'DRIVER') return undefined;
    let stopped = false;
    let unsubscribe = () => {};
    listenForFcmMessages((data) => {
      if (stopped || data.type !== 'DRIVER_ASSIGNMENT') return;
      showFcmNotification(data).catch((err) => console.error('[driver] could not display job notification:', err.message));
      setActiveAlert(data);
      window.dispatchEvent(new Event('ser-driver-job-assigned'));
    }).then((stop) => {
      if (stopped) stop();
      else unsubscribe = stop;
    }).catch((err) => console.error('[driver] foreground push listener unavailable:', err.message));
    return () => { stopped = true; unsubscribe(); };
  }, [user]);

  useEffect(() => {
    const onNotificationClick = (event) => {
      if (event.data?.type === 'SER_NOTIFICATION_CLICKED') setActiveAlert(null);
    };
    navigator.serviceWorker?.addEventListener('message', onNotificationClick);
    return () => navigator.serviceWorker?.removeEventListener('message', onNotificationClick);
  }, []);

  function openAssignedJob() {
    const bookingId = String(activeAlert?.bookingId || '');
    setActiveAlert(null);
    navigate(/^\d+$/.test(bookingId) ? `/driver?bookingId=${encodeURIComponent(bookingId)}` : '/driver');
  }

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
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <DriverPushControls />
      <Outlet />
    </main>
    <PushAlertSheet alert={activeAlert} onOpen={openAssignedJob} onDismiss={() => setActiveAlert(null)} actionLabel="View assigned ride" />
  </div>;
}
