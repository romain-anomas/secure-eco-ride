import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CarFront, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { parseError } from '../../services/api.js';
import Logo from '../../components/Logo.jsx';
import useSeo from '../../hooks/useSeo.js';

export default function Login() {
  useSeo({ title: 'Admin sign in | Secure Eco Ride' });
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('ADMIN');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'DRIVER' ? '/driver' : (loc.state?.from || '/admin')} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { const signedIn = await login(email, password, loginType); nav(signedIn.role === 'DRIVER' ? '/driver' : (loc.state?.from || '/admin'), { replace: true }); }
    catch (err) { setError(parseError(err).message); } finally { setBusy(false); }
  }

  return (
    <div className="admin-shell grid min-h-screen place-items-center bg-night px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size={56} to="/" /></div>
        <form onSubmit={submit} className="rounded-3xl border-t-4 border-leaf bg-white p-7 shadow-2xl">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-night/60">Choose the account type you were given.</p>
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-mist p-1" role="group" aria-label="Account type">
            <button type="button" onClick={() => setLoginType('ADMIN')} aria-pressed={loginType === 'ADMIN'} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${loginType === 'ADMIN' ? 'bg-white text-night shadow-sm' : 'text-night/55 hover:text-night'}`}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Admin</button>
            <button type="button" onClick={() => setLoginType('DRIVER')} aria-pressed={loginType === 'DRIVER'} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${loginType === 'DRIVER' ? 'bg-white text-night shadow-sm' : 'text-night/55 hover:text-night'}`}><CarFront className="h-4 w-4" aria-hidden="true" />Driver</button>
          </div>
          <div className="mt-6 space-y-4">
            <div><label htmlFor="a-email" className="label">Email</label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" aria-hidden="true" /><input id="a-email" type="email" className="input pl-10" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus /></div></div>
            <div><label htmlFor="a-pass" className="label">Password</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" aria-hidden="true" /><input id="a-pass" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-12" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><button type="button" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-night/55 hover:bg-mist hover:text-night focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-leaf" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div></div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…</> : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
