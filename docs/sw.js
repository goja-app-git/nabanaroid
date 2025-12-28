const CACHE = "nabanaroid-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/style.css",
  "./js/app.js",
  "./js/config.js",
  "./js/crypto.js",
  "./js/digits_codec.js",
  "./js/model.js",
  "./js/tagger.js",
  "./js/storage.js",
  "./js/images.js",
  "./img/manifest.json",
  "./model/"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});