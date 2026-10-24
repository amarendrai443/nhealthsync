// Lightweight service worker for PWA offline readiness and installability
const CACHE_NAME = 'nhealth-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-round-192x192.png',
  '/pwa-round-512x512.png',
  '/favicon-32x32.png',
  '/splash-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Non-GET requests should bypass caching
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // STRICT BYPASS: Never intercept or cache node_modules, Vite dev server modules, versioned scripts (?v=), or API calls
  if (
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.searchParams.has('v') ||
    url.search.includes('v=') ||
    url.pathname.startsWith('/api/') ||
    url.hostname === 'localhost' ||
    url.port === '3000'
  ) {
    return;
  }

  // Navigation requests: NetworkFirst with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets matching cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
