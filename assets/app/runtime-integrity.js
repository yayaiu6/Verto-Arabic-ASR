// Shared by the classic service worker and the module inference worker.
globalThis.VertoRuntimeIntegrity = (() => {
 const files = {
  '/assets/runtime/1.23.2/ort-wasm-simd-threaded.asyncify.wasm': {bytes:25499390,sha256:'babec0bbddb6d3082623b99b7e1391b75e0729bcca076ff8424d7753af97fada'},
  '/assets/runtime/1.23.2/ort-wasm-simd-threaded.jsep.wasm': {bytes:23824254,sha256:'ac0d8f1cfbf2732420ad78a86072b8507253c63885a61c3fd640b3055256d31d'}
 };
 function failure(code,entry,actual){const error=new Error(code);error.code=code;error.details={path:entry.path,expected:entry.bytes,actual};return error;}
 async function verify(response,entry){
  if(response.status!==200)throw failure('runtime-http',entry,response.status);
  const reader=response.body?.getReader(),parts=[];let size=0,bytes;
  if(reader){try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>entry.bytes)throw failure('runtime-size',entry,size);parts.push(value);}}catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
   bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
  }else bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length!==entry.bytes)throw failure('runtime-size',entry,bytes.length);
  if(![0,97,115,109,1,0,0,0].every((v,i)=>bytes[i]===v))throw failure('runtime-header',entry,bytes.length);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==entry.sha256)throw failure('runtime-integrity',entry,bytes.length);
  return bytes;
 }
 return {files,verify};
})();
