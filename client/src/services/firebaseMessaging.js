import { getApp, getApps, initializeApp } from 'firebase/app';
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

export const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export const isFirebaseClientConfigured = () => Boolean(
  firebaseClientConfig.apiKey && firebaseClientConfig.projectId &&
  firebaseClientConfig.messagingSenderId && firebaseClientConfig.appId && vapidKey,
);

async function supportedMessaging() {
  if (!isFirebaseClientConfigured()) throw new Error('Firebase web messaging is not configured for this client.');
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
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
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
  return onMessage(messaging, (payload) => callback(payload.data || {}));
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
