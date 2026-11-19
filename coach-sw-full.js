// Coach completo (index.html) — Service Worker NETWORK-FIRST
// Siempre intenta la versión fresca de internet; si no hay red, usa la última guardada.
const CACHE = 'coach-full-v1';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = e.request.url;
  // Nunca tocar Firebase/Google ni nada que no sea de este sitio
  if (u.includes('firebase') || u.includes('firestore') || u.includes('googleapis') || u.includes('gstatic')) return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        try { const c = resp.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } catch (_) {}
        return resp;
      })
      .catch(() => caches.match(e.request))   // sin internet → última versión guardada
  );
});
