/* Offline fallback for the installed web app (iPhone/Android "Add to Home Screen").
   Pages: network first, last good copy when offline. Everything else goes straight to the network. */
const CACHE = 'maatram-pages-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.mode !== 'navigate' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(hit => hit || caches.match('/', { ignoreSearch: true }))
    .then(hit => hit || Response.error())));
});
