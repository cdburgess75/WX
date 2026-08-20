/* WX service worker — offline shell only. The apps do their own data caching
   in localStorage; this just keeps the pages and icons loadable with no
   network. Weather API calls pass through untouched. */
const CACHE = "wx-v2026.08.20.006";
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
  if (u.origin !== location.origin) return; // Open-Meteo / NWS go straight out
  if (e.request.mode === "navigate") {
    // Network-first for pages so new versions land immediately; cache is the
    // fallback when the network is gone. Cached per-URL, so /console.html
    // works offline too without poisoning the root.
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match("./")))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
