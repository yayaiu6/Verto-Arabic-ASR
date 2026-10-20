const CACHE='verto-app-0d37e40b274a962a1348';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/assets/precache.json',{cache:'no-store'});
 if(!response.ok)throw new Error('Application cache manifest unavailable');
 const list=await response.json();
 try{await(await caches.open(CACHE)).addAll(list);}catch(error){await caches.delete(CACHE);throw error;}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('verto-app-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==location.origin||url.pathname==='/sw.js'||url.pathname==='/assets/sw.js'||url.pathname==='/health'||url.pathname.startsWith('/assets/server/')||url.pathname.startsWith('/assets/licenses/'))return;
 event.respondWith((async()=>{
  let cache,hit;try{cache=await caches.open(CACHE);hit=await cache.match(event.request);}catch{return fetch(event.request);}
  const mutable=['/','/index.html','/config.json','/examples.json','/assets/config.json','/assets/examples.json'].includes(url.pathname);
  if(hit&&!mutable)return hit;
  try{
   const response=await fetch(event.request);
   if(response.ok&&(url.pathname.startsWith('/assets/')||url.pathname.startsWith('/examples/')||mutable))try{await cache.put(event.request,response.clone());}catch{}
   return response;
  }catch(error){if(hit)return hit;throw error;}
 })());
});
