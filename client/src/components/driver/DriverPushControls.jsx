import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { api, get, parseError, post } from '../../services/api.js';
import {
  enableFcmForThisDevice,
  getExistingFcmToken,
  hashFcmToken,
  firebaseClientConfigIssue,
  isFirebaseClientConfigured,
  removeFcmToken,
} from '../../services/firebaseMessaging.js';

function deviceLabel() {
  return `${navigator.userAgentData?.platform || navigator.platform || 'Browser'} browser`.slice(0, 120);
}

export default function DriverPushControls() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const configIssue = firebaseClientConfigIssue();

  const refresh = useCallback(async () => {
    let tokenHash;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && isFirebaseClientConfigured()) {
      try {
        const token = await getExistingFcmToken();
        if (token) tokenHash = await hashFcmToken(token);
      } catch { /* show permission/setup state without failing account loading */ }
    }
    const response = await get('/driver/push/status', tokenHash ? { token_hash: tokenHash } : undefined);
    setStatus(response.data);
  }, []);

  useEffect(() => { refresh().catch((err) => setError(parseError(err).message)); }, [refresh]);

  async function enable() {
    setBusy(true); setError(''); setMessage('');
    try {
      if (configIssue) throw new Error(configIssue);
      if (status && !status.configured) throw new Error('Push notifications are not configured on the server yet.');
      const token = await enableFcmForThisDevice();
      await post('/driver/push/devices', { token, device_name: deviceLabel() });
      await refresh();
      setMessage('This device will receive your assigned job alerts.');
    } catch (err) { setError(err.message || parseError(err).message); }
    finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await getExistingFcmToken();
      if (token) {
        await api.delete('/driver/push/devices', { data: { token } });
        await removeFcmToken();
      }
      await refresh();
      setMessage('Job alerts are disabled on this device.');
    } catch (err) { setError(err.message || parseError(err).message); }
    finally { setBusy(false); }
  }

  const registered = Boolean(status?.currentDeviceRegistered);
  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-night/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Assigned job notifications">
      <div>
        <h2 className="font-bold">Assigned job alerts</h2>
        <p className="mt-1 text-sm text-night/60">
          {status?.configured
            ? `${status.registeredDevices} device${status.registeredDevices === 1 ? '' : 's'} registered · notification permission: ${permission}.`
            : 'Enable alerts to be notified when admin assigns a ride to you.'}
        </p>
        {error && <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}
        {message && <p className="mt-2 text-sm font-semibold text-green-800" role="status">{message}</p>}
        {permission === 'denied' && <p className="mt-2 text-sm text-amber-800">Notifications are blocked for this site. Allow them in browser settings, then try again.</p>}
      </div>
      {registered ? (
        <button type="button" className="btn btn-outline btn-sm shrink-0" disabled={busy} onClick={disable}>
          <BellOff className="h-4 w-4" aria-hidden="true" /> {busy ? 'Working…' : 'Disable this device'}
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-sm shrink-0" disabled={busy} onClick={enable}>
          <Bell className="h-4 w-4" aria-hidden="true" /> {busy ? 'Registering…' : 'Enable job alerts'}
        </button>
      )}
    </section>
  );
}
