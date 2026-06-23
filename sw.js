const CACHE_NAME = 'watchonrepeat-v5';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Only handle same-origin requests — never intercept YouTube, Vimeo, CDN, etc.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (HTML pages), always go network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For same-origin assets, try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache the fresh response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
