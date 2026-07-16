/**
 * sw.js
 * ------------------------------------------------------------
 * 完全オフラインで遊べるようにするための Service Worker です。
 *
 * キャッシュのバージョンを上げると、次回アクセス時に新しいファイルへ
 * 自動的に更新されます（HTML/CSS/JS を修正したら CACHE_NAME の数字を
 * 1つ上げてください）。
 * ------------------------------------------------------------
 */

const CACHE_NAME = "kodomo-machi-kaigi-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// キャッシュ優先。キャッシュになければネットワークを試し、それも失敗したらトップページを返す。
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
