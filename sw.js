/* WX service worker — offline shell only. The apps do their own data caching
   in localStorage; this just keeps the pages and icons loadable with no
   network. Weather API calls pass through untouched. */
const CACHE = "wx-v2026.09.14.001";
const ASSETS = ["./", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;      // Open-Meteo / NWS go straight out
  if (e.request.method !== "GET") return;
  if (u.search) return;                          // cache-busting checks bypass us
  if (e.request.mode === "navigate") {
    // Cache-first: the page paints immediately, even on a bad connection, and
    // a background fetch refreshes the copy for next time. The in-app update
    // pill clears these caches when a new version is actually deployed.
    e.respondWith(
      caches.match(e.request).then(hit => {
        const net = fetch(e.request).then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        }).catch(() => hit || caches.match("./"));
        return hit || net;
      })
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
