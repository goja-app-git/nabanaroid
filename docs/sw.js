const CACHE_NAME = "nabanaroid-cache-v3"; // ←数字を上げるたびに強制更新

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
  "./js/crypto.js"
];

// ネット優先にしたいパス（キャッシュで詰まりやすいところ）
function isNetworkFirst(url) {
  const p = url.pathname;
  return (
    p.endsWith("/img/manifest.json") ||
    p.includes("/img/idle/") ||
    p.includes("/img/angry/") ||
    p.includes("/img/nabana/") ||
    p.endsWith("/model/cipher.txt")
  );
}

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
  const url = new URL(req.url);

  // GET以外は触らない
  if (req.method !== "GET") return;

  // ★ネット優先（画像/manifest/cipher）
  if (isNetworkFirst(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const res = await fetch(req, { cache: "no-store" });
        // 成功したら更新キャッシュ
        cache.put(req, res.clone());
        return res;
      } catch {
        // ネット死んでたらキャッシュ
        const cached = await cache.match(req);
        return cached || new Response("", { status: 503 });
      }
    })());
    return;
  }

  // それ以外はキャッシュ優先
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    } catch {
      return cached || new Response("", { status: 503 });
    }
  })());
});