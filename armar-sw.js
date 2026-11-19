// Armar sesión (mobile) — Service Worker network-first (siempre versión fresca)
const CACHE = 'armar-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = e.request.url;
  if (u.includes('firebase') || u.includes('firestore') || u.includes('googleapis') || u.includes('gstatic')) return;
  e.respondWith(
    fetch(e.request).then(r => { try{ const c=r.clone(); caches.open(CACHE).then(k=>k.put(e.request,c)); }catch(_){} return r; })
      .catch(() => caches.match(e.request))
  );
});
