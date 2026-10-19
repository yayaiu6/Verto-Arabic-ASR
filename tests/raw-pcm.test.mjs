import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseRawPcm} from '../web/audio.mjs';
test('raw PCM requires explicit metadata and averages channels',()=>{
  const b=new ArrayBuffer(32000),v=new DataView(b);[16384,-16384,32767,32767].forEach((x,i)=>v.setInt16(i*2,x,true));
  assert.throws(()=>parseRawPcm(b,{}),/PCM/);
  const r=parseRawPcm(b,{format:'s16le',sampleRate:16000,channels:2});
  assert.equal(r.samples[0],0);assert.ok(r.samples[1]>.999);assert.equal(r.sampleRate,16000);
  assert.throws(()=>parseRawPcm(b.slice(0,7),{format:'s16le',sampleRate:16000,channels:2}),/PCM/);
});
