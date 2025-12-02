// Basic service worker for offline caching and PWA installability
const CACHE_NAME = 'dungeonsiege-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/DS-192x192.png',
  './assets/DS-512x512.png',
  './assets/logo.png',
  './src/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    // Network-first: try to get the freshest, update cache, fall back to cache if offline.
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw err;
    }
  })());
});
