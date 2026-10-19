const inflight=new Map();
const PREFIX='verto-model-';
export function validateConfig(config){
 if(!config||!/^[-\w]+\/[-\w.]+$/.test(config.repo)||! /^[a-f0-9]{40}$/.test(config.revision)||config.manifest!=='manifest.json')throw new Error('Invalid immutable model configuration');
 return config;
}
export async function verifyBytes(bytes,entry){
 if(bytes.byteLength!==entry.bytes)throw new Error('Model file size mismatch');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==entry.sha256)throw new Error('Model integrity check failed');
}
export async function clearModels(){
 for(const key of await caches.keys())if(key.startsWith(PREFIX))await caches.delete(key);
}
export async function loadModelFiles(config,notify=()=>{}){
 validateConfig(config);
 const key=config.repo+'@'+config.revision;
 if(inflight.has(key))return inflight.get(key);
 const task=load(config,notify);inflight.set(key,task);
 try{return await task;}finally{inflight.delete(key);}
}
async function load(config,notify){
 const base=`https://huggingface.co/${config.repo}/resolve/${config.revision}/`;
 const name=PREFIX+config.repo.replace('/','-')+'-'+config.revision;
 let cache=null,saved=true;
 try{cache=await caches.open(name);}catch{saved=false;notify({phase:'storage-unavailable'});}
 const manifestUrl=base+config.manifest;
 let manifest;
 let cachedManifest;try{cachedManifest=await cache?.match(manifestUrl);}catch{cache=null;saved=false;notify({phase:'storage-unavailable'});}
 if(cachedManifest){try{manifest=await cachedManifest.json();}catch{/* fetch below */}}
 if(!manifest){const r=await fetch(manifestUrl,{cache:'no-cache'});if(!r.ok)throw new Error('Model manifest unavailable');manifest=await r.json();}
 const allowed=['metro.int8.onnx','bpe.model','tokenizer.json','mel_filters.json','preprocessor.json'];
 if(!Array.isArray(manifest.files)||manifest.files.length!==allowed.length||new Set(manifest.files.map(e=>e.file)).size!==allowed.length||manifest.files.some(e=>!allowed.includes(e.file)||!Number.isSafeInteger(e.bytes)||e.bytes<1||e.bytes>90_000_000||!/^[a-f0-9]{64}$/.test(e.sha256)))throw new Error('Invalid model manifest');
 const files={};
 for(const entry of manifest.files){
  const url=base+entry.file;let bytes;
  try{const hit=await cache?.match(url);if(hit){bytes=new Uint8Array(await hit.arrayBuffer());await verifyBytes(bytes,entry);notify({phase:'cached',file:entry.file});}}
  catch{bytes=null;await cache?.delete(url).catch(()=>{});}
  if(!bytes){
   const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Model download failed');
   const reader=response.body?.getReader(),parts=[];let loaded=0;
   if(reader){while(true){const r=await reader.read();if(r.done)break;loaded+=r.value.length;if(loaded>entry.bytes){await reader.cancel();throw new Error('Model download exceeds expected size');}parts.push(r.value);notify({phase:'downloading',file:entry.file,loaded,total:entry.bytes});}bytes=new Uint8Array(loaded);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}}
   else bytes=new Uint8Array(await response.arrayBuffer());
   notify({phase:'verifying',file:entry.file});await verifyBytes(bytes,entry);
   if(cache)try{await cache.put(url,new Response(bytes));}catch{saved=false;notify({phase:'storage-unavailable'});}
  }
  files[entry.file]=bytes;
 }
 if(cache&&saved){
  try{await cache.put(manifestUrl,new Response(JSON.stringify(manifest)));notify({phase:'saved'});
   // Previous versions survive until every new file has been verified and stored.
   for(const old of await caches.keys())if(old.startsWith(PREFIX)&&old!==name)await caches.delete(old);
  }catch{saved=false;notify({phase:'storage-unavailable'});}
 }
 return {files,saved,manifest};
}
