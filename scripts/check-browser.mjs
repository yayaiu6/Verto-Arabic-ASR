import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
// Private test input paths are supplied by the operator, never committed with the app.
const bundle=process.env.TEST_MODEL_DIR,audio=process.env.TEST_PCM_FILE;
const BASE=process.env.TEST_BASE||'http://127.0.0.1:4180';
if(!bundle||!audio)throw new Error('Set TEST_MODEL_DIR and TEST_PCM_FILE to local test inputs.');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({locale:'en-US'});
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
if(!process.env.TEST_LIVE_HF)await context.route('https://huggingface.co/**',async route=>{
 const name=new URL(route.request().url()).pathname.split('/').at(-1);
 const bytes=await fs.readFile(path.join(bundle,name));
 await route.fulfill({status:200,body:bytes,headers:{'access-control-allow-origin':'*','cross-origin-resource-policy':'cross-origin','content-type':'application/octet-stream'}});
});
const results={};
try{
 await page.goto(BASE);
 assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.match(await page.title(),/Verto/);
 await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 await page.locator('#language').click();assert.match(await page.locator('#record-label').textContent(),/Start recording/);
 await page.evaluate(()=>navigator.serviceWorker.ready);console.log('App shell installed');
 const pcm=await fs.readFile(audio);const name='test.wav';
 const wav=await page.evaluate(async bytes=>{const {encodeWav}=await import('/web/audio.mjs');const pcm=new Float32Array(new Uint8Array(bytes).buffer);return Array.from(new Uint8Array(encodeWav(pcm)));},Array.from(pcm));
 await page.locator('#audio').setInputFiles({name,mimeType:'audio/wav',buffer:Buffer.from(wav)});await page.locator('#run').click();
 console.log('First inference requested');
 await page.waitForFunction(()=>document.getElementById('status').textContent==='Transcription complete',{},{timeout:120000});
 results.text=await page.locator('#text').inputValue();assert.ok(results.text.length>5);
 results.device=JSON.parse(await page.locator('#device').textContent());
 results.firstNetwork=requests.filter(u=>u.includes('huggingface.co')).length;assert.ok(results.firstNetwork>=6);
 await page.screenshot({path:'test-results/english.png',fullPage:true});
 requests.length=0;await page.reload();await page.locator('#audio').setInputFiles({name,mimeType:'audio/wav',buffer:Buffer.from(wav)});await page.locator('#run').click();
 await page.waitForFunction(()=>document.getElementById('status').textContent==='Transcription complete',{},{timeout:120000});
 results.reloadText=await page.locator('#text').inputValue();assert.equal(results.reloadText,results.text);
 results.reloadNetwork=requests.filter(u=>u.includes('huggingface.co')).length;assert.equal(results.reloadNetwork,0);
 await context.setOffline(true);await page.reload();await page.locator('#audio').setInputFiles({name,mimeType:'audio/wav',buffer:Buffer.from(wav)});await page.locator('#run').click();
 await page.waitForFunction(()=>document.getElementById('status').textContent==='Transcription complete',{},{timeout:120000});
 results.offlineText=await page.locator('#text').inputValue();assert.equal(results.offlineText,results.text);
 await context.setOffline(false);
 await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 await page.setViewportSize({width:390,height:844});results.noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert.ok(results.noOverflow);
 await page.screenshot({path:'test-results/arabic-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);results.errors=errors;results.pass=true;
}catch(error){results.error=String(error.stack||error);throw error;}
finally{await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/browser.json',JSON.stringify(results,null,2));await browser.close();}
console.log(JSON.stringify(results,null,2));
