import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get, post, getToken, setToken } from '../services/api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    get('/auth/me').then((r) => setUser(r.data)).catch(() => setToken(null)).finally(() => setChecking(false));
  }, []);

  const login = useCallback(async (email, password, loginType = 'ADMIN') => {
    const res = await post('/auth/login', { email, password, login_type: loginType });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  const value = useMemo(() => ({ user, checking, login, logout, isAdmin: user?.role === 'ADMIN', isDriver: user?.role === 'DRIVER' }), [user, checking, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
