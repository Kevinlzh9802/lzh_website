import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStrings } from '../src/lib/generator.mjs';

const defaults = {
  groups: ['upper', 'lower'],
  firstGroups: ['upper'],
  mode: 'fixed',
  length: 16,
  min: 1,
  max: 30,
  amount: 50,
};

test('respects batch size, alphabet, fixed length and first-character rules', () => {
  const results = generateStrings(defaults);
  assert.equal(results.length, 50);
  for (const result of results) assert.match(result, /^[A-Z][A-Za-z]{15}$/);
});
test('supports numeric-only strings and the shortest permitted length', () => {
  const results = generateStrings({
    ...defaults,
    groups: ['numbers'],
    firstGroups: ['numbers'],
    length: 1,
  });
  for (const result of results) assert.match(result, /^[0-9]$/);
});
test('random lengths include both endpoints without changing the prefix rule', () => {
  for (const endpoint of [1, 30]) {
    const provider = {
      getRandomValues(buffer) {
        buffer[0] = endpoint - 1;
        return buffer;
      },
    };
    const results = generateStrings({ ...defaults, mode: 'random', min: 1, max: 30 }, provider);
    for (const result of results) assert.ok(result.length === endpoint && /^[A-Z]/.test(result));
  }
});
test('rejects empty alphabets and first characters outside the selected alphabet', () => {
  assert.throws(() => generateStrings({ ...defaults, groups: [] }), /至少一个字符集/);
  assert.throws(() => generateStrings({ ...defaults, firstGroups: [] }), /首字符/);
  assert.throws(() => generateStrings({ ...defaults, firstGroups: ['symbols'] }), /首字符/);
});
test('rejects invalid bounds and counts independently on every invocation', () => {
  generateStrings(defaults);
  for (const length of [0, 31, 1.5, NaN])
    assert.throws(() => generateStrings({ ...defaults, length }));
  for (const amount of [0, 51, 1.5, NaN])
    assert.throws(() => generateStrings({ ...defaults, amount }));
  assert.throws(() => generateStrings({ ...defaults, mode: 'random', min: 20, max: 10 }));
  assert.throws(() => generateStrings({ ...defaults, mode: 'random', max: 31 }));
});
test('discards random samples that would bias character selection', () => {
  let calls = 0;
  const provider = {
    getRandomValues(buffer) {
      buffer[0] = calls++ === 0 ? 0xffffffff : 0;
      return buffer;
    },
  };
  const result = generateStrings({ ...defaults, length: 1, amount: 1 }, provider);
  assert.equal(calls, 2);
  assert.deepEqual(result, ['A']);
});
