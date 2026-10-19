import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,verifyBytes} from '../web/model-cache.mjs';
test('model configuration requires an immutable revision and valid repo',()=>{
 assert.throws(()=>validateConfig({repo:'yayaiu6/Verto-Arabic-ASR',revision:'main'}));
 assert.throws(()=>validateConfig({repo:'https://evil.test',revision:'a'.repeat(40)}));
 assert.doesNotThrow(()=>validateConfig({repo:'yayaiu6/Verto-Arabic-ASR',revision:'a'.repeat(40),manifest:'manifest.json'}));
});
test('hash and size mismatches are rejected before caching',async()=>{
 const b=new TextEncoder().encode('abc');
 const expected={bytes:3,sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'};
 await verifyBytes(b,expected);
 await assert.rejects(verifyBytes(b,{...expected,bytes:4}));
 await assert.rejects(verifyBytes(b,{...expected,sha256:'0'.repeat(64)}));
});
