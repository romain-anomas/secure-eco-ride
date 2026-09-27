import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { get } from '../services/api.js';
import { DEFAULT_SETTINGS } from '../utils/defaults.js';
import { telHref, toIntl, whatsappHref } from '../utils/phone.js';

const Ctx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await get('/settings/public');
      setSettings({ ...DEFAULT_SETTINGS, ...r.data });
    } catch { /* keep defaults — the site must still show phone numbers if the API is down */ }
    setLoaded(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => {
    const phones = (settings.phone_numbers || []).filter(Boolean);
    const wa = (settings.whatsapp_numbers || []).filter(Boolean);
    return {
      settings,
      loaded,
      refresh,
      phones,
      whatsappNumbers: wa,
      primaryPhone: phones[0] || '',
      primaryWhatsApp: wa[0] || phones[0] || '',
      tel: (n) => telHref(n),
      intl: (n) => toIntl(n),
      wa: (n, text) => whatsappHref(n, text),
    };
  }, [settings, loaded, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
