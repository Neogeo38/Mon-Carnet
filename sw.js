/* Service worker de Mon carnet — met en cache la coquille de l'application
   pour un démarrage instantané. Les appels à l'API Apps Script passent
   toujours par le réseau (les données doivent rester fraîches).
   IMPORTANT : incrémente CACHE (v2, v3, ...) à chaque mise à jour visuelle
   pour forcer tous les appareils à récupérer la nouvelle version. */
const CACHE = 'mon-carnet-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){
        // {cache:'reload'} force le navigateur à ignorer son propre cache HTTP
        // lors du remplissage initial, pour ne jamais figer une ancienne copie
        return Promise.all(SHELL.map(function(url){
          return fetch(url, {cache:'reload'}).then(function(resp){ return c.put(url, resp); });
        }));
      })
      .then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  const url = new URL(e.request.url);
  if(e.request.method === 'GET' && url.origin === location.origin){
    e.respondWith(
      fetch(e.request, {cache:'no-store'}).then(function(resp){
        const copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return caches.match(e.request); })
    );
  }
});
