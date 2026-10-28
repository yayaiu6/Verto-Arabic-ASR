import {verifyBytes} from './model-cache.mjs?v=28ef369de2067dd52966';
import {validateSamples} from './core.mjs?v=28ef369de2067dd52966';

export function assertExamplesPublishable(manifest){
 if(manifest.previewOnly)throw new Error('Unconfirmed audio distribution rights: local preview only');
 for(const entry of manifest.examples){
  if(entry.publication?.approved!==true || !/^https:\/\//.test(entry.publication.evidence||''))throw new Error(`Unconfirmed audio distribution rights: ${entry.id}`);
 }
}
export function createExampleLoader({fetcher=globalThis.fetch.bind(globalThis),storage=globalThis.caches}={}){
 const memory=new Map();
 return function load(entry){
  if(memory.has(entry.sha256))return memory.get(entry.sha256);
  const task=(async()=>{
   let cache,bytes;
   try{cache=await storage?.open('verto-examples-v1');const hit=await cache?.match(entry.path+'?sha256='+entry.sha256);if(hit){bytes=await hit.arrayBuffer();await verifyBytes(bytes,entry);}}
   catch{bytes=null;}
   if(!bytes){const response=await fetcher(entry.path);if(!response.ok)throw new Error('Example download failed');bytes=await response.arrayBuffer();await verifyBytes(bytes,entry);}
   const samples=new Float32Array(bytes);validateSamples(samples);
   if(Math.abs(samples.length/16000-entry.duration)>.001)throw new Error('Example duration mismatch');
   try{await cache?.put(entry.path+'?sha256='+entry.sha256,new Response(bytes));}catch{/* Playback remains available without persistent storage. */}
   return samples;
  })();memory.set(entry.sha256,task);task.catch(()=>memory.delete(entry.sha256));return task;
 };
}
