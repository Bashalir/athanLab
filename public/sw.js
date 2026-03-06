var CACHE = 'athanlab-v1';

var PRE_CACHE = [
  './',
  './athan.mp3',
  './athan-fajr.mp3',
  './gmp-2026.json',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(PRE_CACHE).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Skip cross-origin API calls (weather, fonts) — network only
  if (url.origin !== self.location.origin) {
    return;
  }

  // For navigation requests (HTML): network-first, fall back to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match('./');
        });
      })
    );
    return;
  }

  // For same-origin assets (JS, CSS, audio, JSON, images): cache-first
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(function (res) {
          caches.open(CACHE).then(function (c) { c.put(e.request, res); });
        }).catch(function () {});
        return cached;
      }
      return fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      });
    })
  );
});
