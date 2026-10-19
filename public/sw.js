const CACHE='verto-app-__BUILD_VERSION__';
self.addEventListener('install',event=>event.waitUntil((async()=>{const list=await(await fetch('/precache.json',{cache:'no-store'})).json();await(await caches.open(CACHE)).addAll(list);})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('verto-app-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==location.origin||url.pathname==='/sw.js'||url.pathname==='/health')return;
 event.respondWith((async()=>{
  let cache,hit;try{cache=await caches.open(CACHE);hit=await cache.match(event.request);}catch{return fetch(event.request);}
  const mutable=['/config.json','/web/index.html','/','/index.html'].includes(url.pathname);
  if(hit&&!mutable)return hit;
  try{const r=await fetch(event.request);if(r.ok&&(['/web/','/runtime/','/ffmpeg/','/licenses/'].some(p=>url.pathname.startsWith(p))||mutable))try{await cache.put(event.request,r.clone());}catch{/* storage failure must not discard a successful network response */}return r;}
  catch(error){if(hit)return hit;throw error;}
 })());
});
