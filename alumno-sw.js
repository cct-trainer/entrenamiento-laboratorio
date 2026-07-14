// ═══════════════════════════════════════════════════════════════════════════
// Service Worker — Portal del Alumno SOCC
// Estrategia: network-first para HTML (siempre busca la versión nueva),
// cache-first para estáticos (íconos). Nunca intercepta Firebase/APIs.
// deploy.bat reemplaza 20260714005928 por el timestamp del build.
// ═══════════════════════════════════════════════════════════════════════════
const CACHE = 'alumno-socc-20260714005928';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('alumno-socc-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo manejar recursos del propio sitio (nunca Firebase, APIs ni CDNs)
  if (url.origin !== location.origin) return;
  // No interferir con el chequeo de versión
  if (url.searchParams.has('_nocache')) return;

  // HTML / navegación: red primero, caché solo como respaldo offline
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      } catch(err) {
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Estáticos: caché primero
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone());
      return fresh;
    } catch(err) { return Response.error(); }
  })());
});
