// 撮影現場体力ラボ - Service Worker
//
// 重要：このファイルは「表示用ファイル(HTML/CSS/JS/アイコン)」だけをキャッシュします。
// トレーニング記録は localStorage に保存されており、Service Worker のキャッシュ更新や
// 再インストールでは一切削除・初期化されません（Cache Storage と localStorage は
// 完全に別の仕組みです）。アプリを更新したいときは CACHE_NAME の数字を上げてください。
const CACHE_NAME = "camera-lab-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// stale-while-revalidate: まずキャッシュを即返しつつ、裏で最新版を取得してキャッシュを更新する。
// オフラインでも起動でき、オンライン時は自動で新しいバージョンに追従する。
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
