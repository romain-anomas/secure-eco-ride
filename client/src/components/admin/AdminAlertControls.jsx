import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { get, parseError, post, api } from '../../services/api.js';
import {
  enableFcmForThisDevice,
  getExistingFcmToken,
  hashFcmToken,
  firebaseClientConfigIssue,
  isFirebaseClientConfigured,
  removeFcmToken,
} from '../../services/firebaseMessaging.js';

function deviceLabel() {
  const platform = navigator.userAgentData?.platform || navigator.platform || 'Browser';
  return `${platform} browser`.slice(0, 120);
}

export default function AdminAlertControls({ soundEnabled, onToggleSound, onTestSound }) {
  const [pushStatus, setPushStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refreshStatus = useCallback(async () => {
    let tokenHash;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && isFirebaseClientConfigured()) {
      try {
        const token = await getExistingFcmToken();
        if (token) tokenHash = await hashFcmToken(token);
      } catch { /* permission can exist while FCM is unavailable */ }
    }
    const response = await get('/push/status', tokenHash ? { token_hash: tokenHash } : undefined);
    setPushStatus(response.data);
  }, []);

  useEffect(() => { refreshStatus().catch((err) => setError(parseError(err).message)); }, [refreshStatus]);

  async function enablePush() {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await enableFcmForThisDevice();
      await post('/push/devices', { token, device_name: deviceLabel() });
      await refreshStatus();
      setMessage('This device is registered for new booking alerts.');
    } catch (err) { setError(err.message || parseError(err).message); }
    finally { setBusy(false); }
  }

  async function disablePush() {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await getExistingFcmToken();
      if (token) {
        await api.delete('/push/devices', { data: { token } });
        await removeFcmToken();
      }
      await refreshStatus();
      setMessage('This device has been removed from booking alerts.');
    } catch (err) { setError(err.message || parseError(err).message); }
    finally { setBusy(false); }
  }

  async function sendTestAlert() {
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await post('/push/test');
      if (!data.registered) setError('No devices are registered. Enable notifications on this phone or computer first.');
      else if (!data.sent) setError(`The test alert could not be delivered (${data.failed} failed). Check Firebase server credentials.`);
      else setMessage(`Test alert sent to ${data.sent} device${data.sent === 1 ? '' : 's'}.`);
    } catch (err) { setError(parseError(err).message); }
    finally { setBusy(false); }
  }

  const firebaseReady = isFirebaseClientConfigured();
  const firebaseConfigIssue = firebaseClientConfigIssue();
  const permissionDenied = typeof Notification !== 'undefined' && Notification.permission === 'denied';
  const thisDeviceRegistered = Boolean(pushStatus?.currentDeviceRegistered);

  return (
    <section className="admin-card mb-5" aria-label="Administrator booking alerts">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black uppercase">New booking alerts</h2>
          <p className="mt-1 max-w-2xl text-sm text-night/65">
            Enable alerts on each phone or computer. Booking pop-ups arrive when the dashboard is closed; when it is open, sound plays if enabled. Your device controls sound for background notifications.
          </p>
          <p className="mt-2 text-xs text-night/55" role="status">
            {pushStatus?.configured
              ? `${pushStatus.registeredDevices} admin device${pushStatus.registeredDevices === 1 ? '' : 's'} registered${thisDeviceRegistered ? ' · this device is enabled' : ''}.`
              : 'Firebase server setup is incomplete.'}
            {!firebaseReady && ` ${firebaseConfigIssue}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={onToggleSound}>
            {soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
            {soundEnabled ? 'Disable sound' : 'Enable sound'}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onTestSound}>
            Test sound
          </button>
          {thisDeviceRegistered && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={sendTestAlert}>
            <Bell className="h-4 w-4" aria-hidden="true" /> {busy ? 'Sending…' : 'Test alert'}
          </button>}
          {thisDeviceRegistered ? (
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={disablePush}>
              <BellOff className="h-4 w-4" aria-hidden="true" /> {busy ? 'Working…' : 'Disable this device'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !pushStatus?.configured || !firebaseReady || permissionDenied} onClick={enablePush}>
              <Bell className="h-4 w-4" aria-hidden="true" /> {busy ? 'Registering…' : 'Enable notifications'}
            </button>
          )}
        </div>
      </div>
      {permissionDenied && <p className="mt-3 text-sm text-amber-800">Notifications are blocked for this site. Allow them in your browser or device settings, then reload this page.</p>}
      {message && <p className="mt-3 text-sm font-semibold text-green-800" role="status">{message}</p>}
      {error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
    </section>
  );
}
