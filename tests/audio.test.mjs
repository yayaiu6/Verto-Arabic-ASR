import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeWav,parseWav,audioError} from '../web/audio.mjs';
test('standard PCM16 WAV can be decoded without browser codecs',()=>{
  const samples=Float32Array.from([0,.5,-.5,1,-1]);
  const decoded=parseWav(encodeWav(samples,16000));
  assert.equal(decoded.sampleRate,16000);
  assert.equal(decoded.samples.length,5);
  decoded.samples.forEach((x,i)=>assert.ok(Math.abs(x-samples[i])<.00004));
});
test('invalid and truncated audio produce an actionable error',()=>{
  assert.equal(parseWav(new ArrayBuffer(3)),null);
  const wav=encodeWav(new Float32Array(8000),16000);
  assert.throws(()=>parseWav(wav.slice(0,100)),/WAV/);
  assert.match(audioError({name:'EncodingError'}),/WAV/);
  assert.match(audioError({name:'NotAllowedError'}),/الميكروفون/);
});
