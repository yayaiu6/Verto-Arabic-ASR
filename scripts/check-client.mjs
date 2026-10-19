import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const bundle=process.env.TEST_MODEL_DIR;
if(!bundle)throw new Error('Set TEST_MODEL_DIR to a local model bundle.');
let samples=null;
if(process.env.TEST_PCM_FILE){const bytes=await fs.readFile(process.env.TEST_PCM_FILE);samples=Array.from(new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)));}
const b=await chromium.launch({channel:'chrome',headless:true});
try {
const p=await b.newPage();
await p.route('https://huggingface.co/**',async r=>{const n=new URL(r.request().url()).pathname.split('/').at(-1);await r.fulfill({body:await fs.readFile(path.join(bundle,n)),headers:{'access-control-allow-origin':'*','cross-origin-resource-policy':'cross-origin'}});});
await p.goto('http://127.0.0.1:4180/web/developer.html');
const result=await p.evaluate(async(samples)=>{const {VertoASR}=await import('/web/verto.mjs');const {encodeWav}=await import('/web/audio.mjs');const config=await(await fetch("/config.json")).json();const client=await VertoASR.fromPretrained(config.repo,{revision:config.revision});try{const result=await client.transcribe(new File([encodeWav(samples?Float32Array.from(samples):new Float32Array(16000))],'test.wav'));return {provider:result.provider,text:result.text,ids:result.ids.length};}finally{client.close();}},samples);
assert.equal(result.provider,'wasm');assert.equal(typeof result.text,'string');assert.ok(Number.isInteger(result.ids));
if(samples)assert.ok(result.text.length>0);
console.log(JSON.stringify(result));
} finally {await b.close();}
