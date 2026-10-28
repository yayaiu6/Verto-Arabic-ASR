import './runtime-integrity.js?v=28ef369de2067dd52966';
export const verifyRuntimeResponse=globalThis.VertoRuntimeIntegrity.verify;
export const runtimeFiles=globalThis.VertoRuntimeIntegrity.files;
export async function loadRuntimeBinary(entry,notify=()=>{},{fetcher=fetch,base=globalThis.location?.origin}={}){
 for(let attempt=0;attempt<2;attempt++){
  const url=new URL(entry.path,base);
  if(attempt){url.searchParams.set('runtime-recovery',crypto.randomUUID());notify({phase:'runtime-recovering'});}
  else notify({phase:'runtime-checking'});
  try{
   const response=await fetcher(url.href,{cache:attempt?'no-store':'default',credentials:'same-origin',signal:AbortSignal.timeout(60000)});
   return await verifyRuntimeResponse(response,entry);
  }catch(error){
   if(attempt){const failure=new Error(error.code?'runtime-invalid':'runtime-network');failure.code=failure.message;failure.details=error.details;throw failure;}
  }
 }
}
