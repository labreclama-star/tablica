/* Офлайн-режим. Меняйте VERSION при каждом обновлении сайта,
   иначе у пользователей останется старая версия из кэша. */
const VERSION = 'v9-2026-10-27';
const CACHE = 'tablica-' + VERSION;
const ASSETS = [
  './', 'index.html', 'app.css', 'fonts.css', 'app.js',
  'trainer.html', 'privacy.html', 'img/hero.png', 'how.html', 'offer.html', 'notice.html', 'print.html', 'print.js', 'landing.js', 'manifest.json',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'fonts/rubik-cyrillic-500-normal.woff2', 'fonts/rubik-latin-500-normal.woff2',
  'fonts/rubik-cyrillic-700-normal.woff2', 'fonts/rubik-latin-700-normal.woff2',
  'fonts/nunito-cyrillic-600-normal.woff2', 'fonts/nunito-latin-600-normal.woff2',
  'fonts/nunito-cyrillic-800-normal.woff2', 'fonts/nunito-latin-800-normal.woff2',
  'fonts/caveat-cyrillic-600-normal.woff2', 'fonts/caveat-latin-600-normal.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      /* каждый файл отдельно: если шрифтов ещё нет, остальное всё равно закэшируется */
      .then((cache) => Promise.all(ASSETS.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('tablica-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* чужие адреса не трогаем */

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit; /* cache-first для статики */
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('index.html') : Response.error()));
    })
  );
});
