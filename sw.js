// The Vvardenfell Compendium (DM edition) as an installable app: this service worker keeps a copy of the site on the device.
// The page: the newest version whenever the device is online (a quick check; nothing is downloaded if it hasn't changed),
// the saved copy when it's offline or the connection is too slow. Everything else (fonts, icons) comes from the saved copy.
// Built by lock.js, which fills in VERSION and FILES; a new upload changes VERSION, so devices pick up the new copy.
const VERSION = "12c1ef9e3d1f6444";
const FILES = ["index.html","manifest.webmanifest","almendra-400-italic.woff2","almendra-400.woff2","almendra-700.woff2","almendra-sc-400.woff2","cinzel-decorative-700.woff2","fondamento-400-italic.woff2","fondamento-400.woff2","fonts.css","apple-touch-icon.png","favicon-64.png","icon-192.png","icon-512.png","maskable-512.png"];
const CACHE = "vc-dm-" + VERSION;
const PAGE = new URL("index.html", self.registration.scope).href;
const SLOW = 5000;   // ms to wait for the network before opening the saved copy

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("vc-dm-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    const net = fetch(req, { cache: "no-cache" });
    e.waitUntil(net.then((res) => { if (res.ok) return caches.open(CACHE).then((c) => c.put(PAGE, res.clone())); }).catch(() => {}));
    const slow = new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), SLOW));
    e.respondWith(Promise.race([net, slow]).catch(() => caches.match(PAGE).then((hit) => hit || net)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
