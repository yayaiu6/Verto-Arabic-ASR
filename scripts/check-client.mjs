import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const bundle=process.env.TEST_MODEL_DIR;
if(!bundle)throw new Error('Set TEST_MODEL_DIR to a local model bundle.');
const b=await chromium.launch({channel:'chrome',headless:true});
try {
const p=await b.newPage();
await p.route('https://huggingface.co/**',async r=>{const n=new URL(r.request().url()).pathname.split('/').at(-1);await r.fulfill({body:await fs.readFile(path.join(bundle,n)),headers:{'access-control-allow-origin':'*','cross-origin-resource-policy':'cross-origin'}});});
await p.goto('http://127.0.0.1:4180/web/developer.html');
const result=await p.evaluate(async()=>{const {VertoASR}=await import('/web/verto.mjs');const {encodeWav}=await import('/web/audio.mjs');const client=new VertoASR();try{const info=await client.load();const result=await client.transcribe(new File([encodeWav(new Float32Array(16000))],'silence.wav'));return {provider:info.provider,text:result.text,ids:result.ids.length};}finally{client.close();}});
assert.equal(result.provider,'wasm');assert.equal(typeof result.text,'string');assert.ok(Number.isInteger(result.ids));
console.log(JSON.stringify(result));
} finally {await b.close();}
