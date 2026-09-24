/* ASPGE-PA Service Worker — cache de assets estáticos + fallback offline.
   API (/api/) nunca é cacheada: sempre vai à rede. */
const CACHE = 'aspge-pwa-v1';
const ASSETS = [
  '/',
  '/login',
  '/manifest.webmanifest',
  '/public/logo.png',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png',
  '/public/icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Nunca interceptar API — dados sempre frescos da rede
  if (url.pathname.startsWith('/api/')) return;

  // Navegação (HTML): network-first, cai no cache se offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('/login')))
    );
    return;
  }

  // Assets estáticos same-origin: cache-first
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
