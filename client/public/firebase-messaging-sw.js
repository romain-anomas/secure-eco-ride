// Firebase's compatibility service worker is loaded from Google's official SDK CDN.
// Keep this version aligned with client/package.json.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/admin/bookings', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
    const appWindow = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (appWindow) {
      await appWindow.navigate(url);
      return appWindow.focus();
    }
    return self.clients.openWindow(url);
  }));
});

try {
  const encodedConfig = new URL(self.location.href).searchParams.get('firebaseConfig');
  if (encodedConfig) {
    const firebaseConfig = JSON.parse(encodedConfig);
    importScripts(
      'https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js',
    );
    firebase.initializeApp(firebaseConfig);
    firebase.messaging().onBackgroundMessage((payload) => {
      const data = payload.data || {};
      self.registration.showNotification(data.title || 'New Ride Booking!', {
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
    });
  }
} catch (err) {
  console.error('[fcm-sw] Firebase messaging could not initialize:', err?.message || 'configuration error');
}
