/* REGX VISUALS — service worker
   Caches the site shell so the app installs and opens instantly.
   Videos and Spotify always stream live from the network. */

const CACHE = 'regx-v4';
const SHELL = [
  './',
  './index.html',
  './regx-logo-nav.png',
  './regx-logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Only handle same-origin GET requests; let YouTube/Spotify/fonts stream normally
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // Never cache the CMS, its config, or the editable content — always fresh
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/content/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
