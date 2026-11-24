// Offline cache. Stale-while-revalidate: instant loads, updates picked up on next launch.
const CACHE = "keepersdesk-v5-ai";
const LIB = "keepersdesk-lib"; // on-device AI library: pinned, versioned CDN files (never change)
const ASSETS = ["./", "index.html", "css/app.css", "js/seed.js", "js/ai.js", "js/ai-worker.js", "js/app.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  // Only drop our own old app caches; keep the AI library and the downloaded model ("transformers-cache").
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("keepersdesk-v") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.pathname.endsWith(".wasm")) return; // transformers.js caches the runtime itself
  if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open(LIB).then(async (cache) => {
      const hit = await cache.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request).then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
      return isolate(await (hit || net));
    })
  );
});
// Cross-origin isolation lets the on-device model use several CPU threads (GitHub Pages can't set these headers itself).
function isolate(res) {
  if (!res || res.status === 0 || res.type === "opaque") return res;
  const h = new Headers(res.headers);
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Embedder-Policy", "require-corp");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
