// Network-first SW: HTML/JS serve from network, fallback to cache.
// Cache name is versioned; old caches are deleted on activate.
// Satisfies: REQ-010 (offline fallback), V2-30 step 4

const CACHE_VERSION = 'vs-v3';
const CACHE_NAME = `vayusaathi-${CACHE_VERSION}`;
const SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET or API requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Network-first: try network, fall back to cache, then shell
  event.respondWith(
    fetch(request)
      .then((res) => {
        // Only cache successful same-origin responses
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match('/'))
      )
  );
});
