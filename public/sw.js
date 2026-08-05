// CreatorPulse service worker — network-first strategy.
//
// Why network-first: earlier versions of this app suffered badly from stale
// caching (uploaded fixes that never reached real devices for hours). This
// service worker always tries the live network first and only falls back to
// a cached copy when there's genuinely no connection. That means:
//   - Online (the vast majority of the time): always the newest deployed code.
//   - Offline: the app still opens instead of showing a browser error.
// API calls and anything cross-origin are never touched by this worker.

const CACHE_NAME = "creatorpulse-v1";
const PRECACHE_URLS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle simple same-origin GETs. Never intercept API calls, uploads,
  // or anything cross-origin (Groq, Pollinations, Supabase, etc.).
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("/"))
      )
  );
});
