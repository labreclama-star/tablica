/* Офлайн-режим. Меняйте VERSION при каждом обновлении сайта,
   иначе у пользователей останется старая версия из кэша. */
const VERSION = "v17-2026-10-29";
const CACHE = 'tablica-' + VERSION;
const ASSETS = [
  './', 'app.css', 'fonts.css', 'app.js',
  /*PAGES*/ 'index.html', 'trainer.html', 'blog.html', 'print.html', 'blog-kak-vyuchit-tablicu-umnozheniya.html', 'blog-tablica-umnozheniya-na-7-i-8.html', 'blog-delenie-kak-obratnoe-umnozhenie.html', 'blog-skolko-zanimatsya-v-den.html', 'blog-oshibki-roditelej-tablica-umnozheniya.html', 'blog-tablica-umnozheniya-na-9.html', 'blog-metodika-ahmadullina.html', 'blog-rebenok-ne-ponimaet-tablicu-umnozheniya.html', 'blog-igry-tablica-umnozheniya-1-2-klass.html', 'blog-umnozhenie-na-5-i-10.html', 'blog-tablica-umnozheniya-legko.html', 'blog-trenazher-po-matematike-umnozhenie.html', 'blog-tablica-umnozheniya-i-deleniya-3-klass.html', 'blog-uchim-tablicu-umnozheniya-vmeste.html', 'blog-raspechatat-tablicu-umnozheniya.html', 'blog-tablica-umnozheniya-na-4.html', 'blog-tablica-umnozheniya-na-3-trenazher.html', 'blog-tablica-umnozheniya-na-2-i-3.html', 'blog-tablica-umnozheniya-igra.html', 'blog-kartochki-tablica-umnozheniya.html', 'blog-tablica-umnozheniya-4-klass.html', 'blog-proverka-tablicy-umnozheniya-3-klass.html', 'blog-kak-bystro-vyuchit-rebenku.html', 'blog-kak-bystro-vyuchit-tablicu-umnozheniya.html', 'blog-besplatnyj-trenazher-tablica-umnozheniya.html', 'privacy.html', 'how.html', 'offer.html', 'notice.html', 'about.html', 'contacts.html', 'partners.html', 'img/blog/kak-vyuchit-tablicu-umnozheniya.png', 'img/blog/tablica-umnozheniya-na-7-i-8.png', 'img/blog/delenie-kak-obratnoe-umnozhenie.png', 'img/blog/skolko-zanimatsya-v-den.png', 'img/blog/oshibki-roditelej-tablica-umnozheniya.png', 'img/blog/tablica-umnozheniya-na-9.png', 'img/blog/metodika-ahmadullina.png', 'img/blog/rebenok-ne-ponimaet-tablicu-umnozheniya.png', 'img/blog/igry-tablica-umnozheniya-1-2-klass.png', 'img/blog/umnozhenie-na-5-i-10.png', 'img/blog/tablica-umnozheniya-legko.png', 'img/blog/trenazher-po-matematike-umnozhenie.png', 'img/blog/tablica-umnozheniya-i-deleniya-3-klass.png', 'img/blog/uchim-tablicu-umnozheniya-vmeste.png', 'img/blog/raspechatat-tablicu-umnozheniya.png', 'img/blog/tablica-umnozheniya-na-4.png', 'img/blog/tablica-umnozheniya-na-3-trenazher.png', 'img/blog/tablica-umnozheniya-na-2-i-3.png', 'img/blog/tablica-umnozheniya-igra.png', 'img/blog/kartochki-tablica-umnozheniya.png', 'img/blog/tablica-umnozheniya-4-klass.png', 'img/blog/proverka-tablicy-umnozheniya-3-klass.png', 'img/blog/kak-bystro-vyuchit-rebenku.png', 'img/blog/kak-bystro-vyuchit-tablicu-umnozheniya.png', 'img/blog/besplatnyj-trenazher-tablica-umnozheniya.png', /*END*/
  'img/hero.png', 'img/og.png', 'theme.js', 'print.js', 'landing.js', 'manifest.json',
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
  if (url.origin !== self.location.origin) return;

  // Для HTML-страниц (блог, главная) всегда качаем свежую версию из сети
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
    );
    return;
  }

  // Для картинок и стилей берем из кэша (для офлайн-режима)
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
