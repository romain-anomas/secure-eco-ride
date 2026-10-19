import { getApp, getApps, initializeApp } from 'firebase/app';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseValue = (value = '') => String(value).trim().replace(/^(["'])(.*)\1$/, '$2');
const webAppId = firebaseValue(import.meta.env.VITE_FIREBASE_APP_ID);
const appIdMatch = webAppId.match(/^1:(\d+):web:([A-Za-z0-9_-]+)$/);
const senderIdFromAppId = appIdMatch?.[1] || '';

export const firebaseClientConfig = {
  apiKey: firebaseValue(import.meta.env.VITE_FIREBASE_API_KEY),
  projectId: firebaseValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  // The Firebase web app ID embeds its project sender number. Prefer it so a
  // stale duplicate Vercel variable cannot create an internally mixed config.
  messagingSenderId: senderIdFromAppId || firebaseValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: webAppId,
};
const vapidKey = firebaseValue(import.meta.env.VITE_FIREBASE_VAPID_KEY);

export function firebaseClientConfigIssue() {
  if (!firebaseClientConfig.apiKey || !firebaseClientConfig.projectId
    || !firebaseClientConfig.messagingSenderId || !firebaseClientConfig.appId || !vapidKey) {
    return 'Firebase web messaging settings are incomplete in this deployment.';
  }
  if (!appIdMatch) {
    return 'Vercel VITE_FIREBASE_APP_ID must be the appId from Firebase Project settings → General → Your apps → Web app (format: 1:<sender-id>:web:<app-id>). Save it for Production and redeploy.';
  }
  return '';
}

export const isFirebaseClientConfigured = () => !firebaseClientConfigIssue();

function explainInstallationsError(error) {
  if (error?.code === 'installations/request-failed' || /INVALID_ARGUMENT/.test(error?.message || '')) {
    return new Error('Firebase rejected the web config. In Vercel, make sure the API key and project ID match this Firebase Web App. Allow this site in API key restrictions, then redeploy.');
  }
  return error;
}

async function supportedMessaging() {
  const configIssue = firebaseClientConfigIssue();
  if (configIssue) throw new Error(configIssue);
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !(await isSupported())) {
    throw new Error('This browser does not support Firebase web push notifications.');
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseClientConfig);
  return getMessaging(app);
}

async function messagingRegistration() {
  const query = new URLSearchParams({ firebaseConfig: JSON.stringify(firebaseClientConfig) });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`, { scope: '/' });
}

export async function enableFcmForThisDevice() {
  const messaging = await supportedMessaging();
  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'Notifications are blocked. Allow them for this site in your browser settings, then try again.'
      : 'Notification permission was not granted.');
  }
  const registration = await messagingRegistration();
  let token;
  try { token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }); }
  catch (error) { throw explainInstallationsError(error); }
  if (!token) throw new Error('Firebase did not return a device token. Check the Firebase web push certificate.');
  return token;
}

export async function getExistingFcmToken() {
  if (!isFirebaseClientConfigured() || !('Notification' in window) || Notification.permission !== 'granted') return null;
  const messaging = await supportedMessaging();
  const registration = await messagingRegistration();
  return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
}

export async function removeFcmToken() {
  const messaging = await supportedMessaging();
  await deleteToken(messaging);
}

export async function listenForFcmMessages(callback) {
  if (!isFirebaseClientConfigured()) return () => {};
  const messaging = await supportedMessaging();
  return onMessage(messaging, (payload) => {
    const data = payload.data || {};
    if (!claimForegroundMessage(data.bookingId)) return;
    callback(data);
  });
}

function claimForegroundMessage(id) {
  if (!id) return true;
  const key = `ser_fcm_foreground_${id}`;
  try {
    const now = Date.now();
    const previous = Number(localStorage.getItem(key) || 0);
    if (previous && now - previous < 24 * 60 * 60 * 1000) return false;
    localStorage.setItem(key, String(now));
  } catch { /* storage may be unavailable; each open tab still handles its message */ }
  return true;
}

export async function showFcmNotification(data = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return;
  await registration.showNotification(data.title || 'New Ride Booking!', {
    body: data.body || 'A new booking has arrived.',
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: `booking-${data.bookingId || 'new'}`,
    renotify: true,
    silent: false,
    vibrate: [250, 100, 250, 100, 400],
    requireInteraction: true,
    data: { url: data.url || '/admin/bookings' },
  });
}

export async function hashFcmToken(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
