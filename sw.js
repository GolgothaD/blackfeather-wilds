const V='blackfeather-wilds-v4';
const FILES=['./','index.html','vendor/three.min.js','world.js','bird.js','main.js','bloom.js','life.js','biomes.js','game.js','hunt.js','vendor/three-addons.js','hdr/sky_1k.hdr','ui.js','manifest.json','favicon.ico','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-192.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-32.png',
 'tex/Grass004_c.jpg','tex/Ground037_c.jpg','tex/Rock030_c.jpg','tex/Rock030_n.jpg','tex/Bark007_c.jpg','tex/Bark007_n.jpg','tex/Moss002_c.jpg','tex/Grass004_n.jpg','tex/Ground037_n.jpg','tex/Moss002_n.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
