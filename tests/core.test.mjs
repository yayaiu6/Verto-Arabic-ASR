import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ctcIds, decodePieces, validateSamples, logMel } from '../web/core.mjs';

test('CTC merges repeats before dropping blanks and respects valid output length', () => {
  const ids = [3,3,0,3,4,4,0,5,9];
  const probs = new Float32Array(ids.length * 10).fill(-10);
  ids.forEach((id,i) => probs[i*10+id] = 0);
  assert.deepEqual(ctcIds(probs, 10, 8), [3,3,4,5]);
});
test('SentencePiece offset, boundary spaces and special ids', () => {
  assert.equal(decodePieces([0,3,4,5,1], ['▁أهلا','▁hello','!']), 'أهلا hello!');
});
test('SentencePiece unknown surface preserves literal spaces', () => {
  assert.equal(decodePieces([3], ['<unk>']), ' ⁇ ');
  assert.equal(decodePieces([4,3,5], ['<unk>','▁hello','▁world']), 'hello ⁇  world');
});
test('rejects unsupported duration and invalid samples', () => {
  assert.throws(() => validateSamples(new Float32Array(7999)), /0.5/);
  assert.throws(() => validateSamples(new Float32Array(480001)), /30/);
  assert.throws(() => validateSamples(new Float32Array(8000).fill(NaN)), /finite/);
  assert.doesNotThrow(() => validateSamples(new Float32Array(8000)));
});
test('silence produces finite normalized mel features', () => {
  const filters = Array.from({length:257}, () => Array(80).fill(1));
  const result = logMel(new Float32Array(8000), filters);
  assert.equal(result.frames,51);
  assert.equal(result.data.length,51*80);
  assert.ok(result.data.every(Number.isFinite));
});
