const CACHE_NAME = "gayatri-static-v3";
const SHELL = ["/offline.html", "/icons/gayatri-store-192.png", "/icons/gayatri-store-512.png", "/icons/gayatri-store-maskable.png", "/icons/gayatri-store-192.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("gayatri-static-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
    return;
  }

  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/");
  if (!isStaticAsset) return;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") void cache.put(request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(request);
      return cached || Response.error();
    }
  }));
});
