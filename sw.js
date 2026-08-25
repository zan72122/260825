const CACHE='wajima-124-layers-v1';
const CORE=[
  './','./index.html','./styles.css','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './src/main.js','./src/math.js','./src/geometry.js','./src/renderer.js','./src/materials.js',
  './src/game-data.js','./src/scene-kit.js','./src/workshop.js','./src/tasks.js','./src/audio.js','./src/ui.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok&&new URL(event.request.url).origin===self.location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
