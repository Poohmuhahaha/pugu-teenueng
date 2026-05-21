/**
 * Minimal offline shell service worker.
 * - Pre-caches the app shell (login, signup, root HTML, manifest, icons)
 * - Network-first for /api/* (so authenticated calls don't get stale)
 * - Stale-while-revalidate for static assets
 * - Falls back to cached root when offline and the request is a navigation
 */
const VERSION = 'lifeos-v1';
const SHELL = ['/', '/login', '/signup', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((c) =>
      c.addAll(SHELL).catch(() => {
        // SHELL urls might not exist yet (icons) — install anyway
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // API requests: network-first, cache failures
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Navigations: cache-first w/ network fallback, root fallback when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match(req);
        return cached ?? caches.match('/');
      })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    })
  );
});
