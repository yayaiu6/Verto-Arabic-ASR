import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
let downloads=0,broken=false;
const bytes=new Uint8Array([1,2,3]);
const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
const names=['metro.int8.onnx','bpe.model','tokenizer.json','mel_filters.json','preprocessor.json'];
const manifest={files:names.map(file=>({file,bytes:3,sha256:hash}))};
await page.route('https://huggingface.co/**',async route=>{
 const name=route.request().url().split('/').at(-1);
 if(name==='manifest.json')await route.fulfill({json:manifest,headers:{'access-control-allow-origin':'*','cross-origin-resource-policy':'cross-origin'}});
 else{downloads++;await route.fulfill({body:broken?Buffer.from([8]):Buffer.from(bytes),headers:{'access-control-allow-origin':'*','cross-origin-resource-policy':'cross-origin'}});}
});
try{
 await page.goto('http://127.0.0.1:4180');
 const run=()=>page.evaluate(async()=>{const {loadModelFiles}=await import('/web/model-cache.mjs');const config={repo:'yayaiu6/Verto-Arabic-ASR',revision:'a'.repeat(40),manifest:'manifest.json'};const events=[];const [a,b]=await Promise.all([loadModelFiles(config,e=>events.push(e)),loadModelFiles(config)]);return{saved:a.saved,same:a===b,events};});
 const first=await run();assert.ok(first.saved&&first.same);assert.equal(downloads,5);
 await run();assert.equal(downloads,5);
 await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(n=>n.startsWith('verto-model-')));const key=(await cache.keys()).find(k=>k.url.endsWith('metro.int8.onnx'));await cache.put(key,new Response(new Uint8Array([0])));});
 await run();assert.equal(downloads,6);
 await page.evaluate(async()=>{const {clearModels}=await import('/web/model-cache.mjs');await clearModels();});
 broken=true;await assert.rejects(run());
 assert.equal(await page.evaluate(async()=>{const cache=await caches.open((await caches.keys()).find(n=>n.startsWith('verto-model-')));return(await cache.keys()).some(k=>k.url.endsWith('metro.int8.onnx'));}),false);
 broken=false;
 const quota=await page.evaluate(async()=>{const original=Cache.prototype.put;Cache.prototype.put=async()=>{throw new DOMException('quota','QuotaExceededError');};try{const {loadModelFiles}=await import('/web/model-cache.mjs');return(await loadModelFiles({repo:'yayaiu6/Verto-Arabic-ASR',revision:'b'.repeat(40),manifest:'manifest.json'})).saved;}finally{Cache.prototype.put=original;}});
 assert.equal(quota,false);
 console.log('PASS: parallel dedupe, warm cache, corruption repair, interrupted/invalid download rejection, clear, quota-memory fallback.');
}finally{await browser.close();}
