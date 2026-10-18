// Admin-only worker. It deliberately does not cache dashboard pages or API data.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A pass-through navigation handler lets browsers offer the in-app install prompt
// without keeping private admin responses in Cache Storage.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});
