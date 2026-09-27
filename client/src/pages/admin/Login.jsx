import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={loc.state?.from || '/admin'} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); nav(loc.state?.from || '/admin', { replace: true }); }
    catch (err) { setError(parseError(err).message); } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-night px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo size={56} to="/" /></div>
        <form onSubmit={submit} className="rounded-3xl border-t-4 border-leaf bg-white p-7 shadow-2xl">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">Admin sign in</h1>
          <div className="mt-6 space-y-4">
            <div><label htmlFor="a-email" className="label">Email</label><input id="a-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus /></div>
            <div><label htmlFor="a-pass" className="label">Password</label><input id="a-pass" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…</> : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
