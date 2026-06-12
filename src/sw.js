// Medisync — neutralized service worker (replaces OHIF's PWA SW).
//
// OHIF ships a caching service worker that cached our injected medisync-*.js,
// so UI edits stayed invisible until a manual "Unregister". This replacement
// has NO fetch handler (it never serves from cache → every asset comes from the
// network) and clears any caches the old SW left behind on activation. OHIF may
// re-register /sw.js on each load; that's harmless and idempotent here.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      var keys = await caches.keys();
      await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    } catch (e) {}
    try { await self.clients.claim(); } catch (e) {}
  })());
});

// No 'fetch' listener on purpose — the SW stays passthrough and never caches.
