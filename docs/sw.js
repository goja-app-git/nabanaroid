const CACHE_NAME = "nabanaroid-cache-v1";
const CORE = [
  "./",
  "./index.html",
  "./assets/style.css",
  "./manifest.json",

  "./js/app.js",
  "./js/config.js",
  "./js/images.js",
  "./js/tagger.js",
  "./js/model.js",
  "./js/storage.js",
  "./js/digits_codec.js",
  "./js/crypto.js",

  "./img/manifest.json",
  "./model/cipher.txt"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try{
      return await fetch(req);
    }catch{
      return cached || new Response("", { status: 503 });
    }
  })());
});