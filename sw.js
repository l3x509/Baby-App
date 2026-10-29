/* Nestling service worker: lets the app open from the home screen and load
   even with a weak connection. Baby data always comes live from Supabase and
   is never cached here. Bump VERSION when the list of app files changes. */
const VERSION = 'nestling-v1';
const SHELL = [
  './', './index.html', './config.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    try { await cache.add(LIB); } catch (e) { /* fetched again on first use */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Live data: sign-in, entries and sync always go straight to Supabase.
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) return;

  // The app page and keys: try the network first so updates show right away.
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('config.js'))) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const fresh = await fetch(req);
        if (fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Icons, manifest, the sync library and fonts: use the saved copy, refresh it in the background.
  const cacheable = sameOrigin || url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(req);
    const refresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => null);
    return saved || (await refresh) || Response.error();
  })());
});
