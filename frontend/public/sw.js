// Network-only API: never cache photographs or successful mutation responses.
const CACHE = 'awamon-offline-v2';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.add('/offline.html'))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('awamon-') && k !== CACHE).map(k => caches.delete(k))))])); });
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
});
