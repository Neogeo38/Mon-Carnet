/* Service worker de Mon carnet — met en cache la coquille de l'application
   pour un démarrage instantané. Les appels à l'API Apps Script passent
   toujours par le réseau (les données doivent rester fraîches). */
const CACHE = 'mon-carnet-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  const url = new URL(e.request.url);
  // Uniquement les ressources locales en GET : réseau d'abord, cache en secours (hors-ligne)
  if(e.request.method === 'GET' && url.origin === location.origin){
    e.respondWith(
      fetch(e.request).then(function(resp){
        const copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return caches.match(e.request); })
    );
  }
});
