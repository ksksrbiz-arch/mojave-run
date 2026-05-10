/* Mojave Run — Service Worker
 *
 * Strategy:
 *   - HTML/navigation requests: network-first, falling back to cached '/'
 *     so updates ship instantly online but the game still loads offline.
 *   - Same-origin static assets (JS/CSS/SVG/manifest): cache-first, and
 *     opportunistically refreshed in the background ("stale-while-revalidate")
 *     so a returning player gets the latest cached copy without the
 *     network-first round-trip cost.
 *   - Cross-origin (e.g. a multiplayer relay over wss://): not handled at
 *     all — fetch passes through to the network.
 *
 * Cache-name versioning: bump CACHE_VERSION to invalidate old caches when
 * shipping a major asset change. Old caches are purged in `activate`.
 */
const CACHE_VERSION = 'v2-2026-05-10';
const CACHE_NAME    = 'mojave-run-' + CACHE_VERSION;

const PRECACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/mp.js',
  '/icon.svg',
  '/manifest.webmanifest',
  '/privacy-policy.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('mojave-run-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // only intercept GETs from the same origin; pass everything else through
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // navigations: network-first so updates land immediately when online
  const isNav = req.mode === 'navigate' ||
                (req.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/').then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // static assets: cache-first with background refresh
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchAndUpdate = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetchAndUpdate;
    })
  );
});
