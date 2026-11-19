const CACHE_NAME = 'meal-picker-shell-v14';
const SHELL_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-180.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        SHELL_ASSETS.map(url =>
          fetch(url, { cache: 'reload' }).then(res => {
            if (res && res.ok) return cache.put(url, res);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first with cache: 'no-store' to bypass iOS Safari 10-min HTTP cache on GitHub Pages
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
  );
});
