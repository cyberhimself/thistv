const CACHE_NAME = 'thisTV-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/assets/styles.min.css',
  '/assets/styles.css',
  '/assets/scripts.js',
  '/assets/logo.svg',
  '/data/movies.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // network-first for JSON (freshness), cache-first for static assets
  const url = new URL(event.request.url);
  if(url.pathname.endsWith('/data/movies.json')){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(res=>res||fetch(event.request).catch(()=>caches.match('/index.html'))));
});
