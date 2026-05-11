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
const CACHE_VERSION = 'v3.0.2-2026-05-11';
const CACHE_NAME    = 'mojave-run-' + CACHE_VERSION;
const NAVIGATION_TIMEOUT_MS = 1200;
const MAX_RUNTIME_ENTRIES = 36;

const PRECACHE = [
  '/',
  '/index.html',
  '/v2.html',
  '/app.js',
  '/mp.js',
  '/icon.svg',
  '/manifest.webmanifest',
  '/privacy-policy.html',
];

const STATIC_EXTENSIONS = ['.html', '.js', '.css', '.svg', '.png', '.json', '.webmanifest', '.ico', '.txt'];

function isStaticAsset(url) {
  const lastDot = url.pathname.lastIndexOf('.');
  if (lastDot === -1) return false;
  return STATIC_EXTENSIONS.indexOf(url.pathname.slice(lastDot).toLowerCase()) !== -1;
}

function cacheableResponse(res) {
  return res && res.status === 200 && (res.type === 'basic' || res.type === 'default');
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(() => resolve(null), ms));
}

function offlineShellResponse() {
  return new Response('<!doctype html><title>Mojave Run offline</title><body style="margin:0;background:#1a0f08;color:#f5d76e;font:16px monospace;display:grid;place-items:center;min-height:100vh;text-align:center"><main><h1>MOJAVE RUN</h1><p>Offline cache is not ready yet. Reconnect once to finish installing.</p></main></body>', {
    status: 503,
    statusText: 'offline',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function putInCache(req, res) {
  if (!cacheableResponse(res)) return Promise.resolve(res);
  return caches.open(CACHE_NAME).then(cache =>
    cache.put(req, res.clone()).then(() => trimCache(cache)).catch(() => {})
  ).then(() => res);
}

function trimCache(cache) {
  return cache.keys().then(keys => {
    if (keys.length <= MAX_RUNTIME_ENTRIES) return null;
    const removable = keys.filter(req => PRECACHE.indexOf(new URL(req.url).pathname) === -1);
    const overflow = Math.max(0, keys.length - MAX_RUNTIME_ENTRIES);
    return Promise.all(removable.slice(0, overflow).map(req => cache.delete(req)));
  });
}

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
      .then(() => self.registration.navigationPreload && self.registration.navigationPreload.enable
        ? self.registration.navigationPreload.enable().catch(() => {})
        : null)
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'PREFETCH') {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).catch(() => {}));
  }
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
      caches.match('/').then(cachedShell => {
        const preload = event.preloadResponse ? event.preloadResponse.catch(() => null) : Promise.resolve(null);
        const network = preload.then(preloaded => preloaded || fetch(req))
          .then(res => {
            if (cacheableResponse(res)) {
              const shell = res.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put('/', shell.clone()).catch(() => {});
                cache.put('/index.html', shell).catch(() => {});
              }).catch(() => {});
            }
            return res;
          })
          .catch(() => null);
        if (cachedShell) {
          event.waitUntil(network);
          return cachedShell;
        }
        return Promise.race([network, timeout(NAVIGATION_TIMEOUT_MS)])
          .then(res => res || caches.match('/').then(r => r || caches.match('/index.html')))
          .then(res => res || offlineShellResponse());
      })
    );
    return;
  }

  if (!isStaticAsset(url)) return;

  // static assets: cache-first with background refresh
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchAndUpdate = fetch(req).then(res => {
        putInCache(req, res);
        return res;
      }).catch(() => cached || new Response('', { status: 504, statusText: 'offline' }));
      if (cached) event.waitUntil(fetchAndUpdate);
      return cached || fetchAndUpdate;
    })
  );
});
