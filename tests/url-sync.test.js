import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, serializeState } from '../js/url-sync.js';

test('parseQuery: empty string returns empty state', () => {
  assert.deepEqual(parseQuery(''), { month: null, region: null, category: null, festival: null });
});

test('parseQuery: month only', () => {
  assert.deepEqual(parseQuery('?month=5'), { month: 5, region: null, category: null, festival: null });
});

test('parseQuery: all fields', () => {
  const q = '?month=5&region=' + encodeURIComponent('경상남도') + '&category=' + encodeURIComponent('꽃') + '&festival=jinhae';
  assert.deepEqual(parseQuery(q), { month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' });
});

test('parseQuery: invalid month ignored', () => {
  assert.equal(parseQuery('?month=abc').month, null);
  assert.equal(parseQuery('?month=13').month, null);
  assert.equal(parseQuery('?month=0').month, null);
});

test('parseQuery: leading "?" optional', () => {
  assert.deepEqual(parseQuery('month=5'), { month: 5, region: null, category: null, festival: null });
});

test('serializeState: empty state returns ""', () => {
  assert.equal(serializeState({ month: null, region: null, category: null, festival: null }), '');
});

test('serializeState: only set fields included', () => {
  const result = serializeState({ month: 5, region: null, category: '꽃', festival: null });
  // 순서는 month -> region -> category -> festival
  assert.equal(result, '?month=5&category=' + encodeURIComponent('꽃'));
});

test('serializeState: all fields', () => {
  const result = serializeState({ month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' });
  assert.equal(
    result,
    '?month=5&region=' + encodeURIComponent('경상남도') +
    '&category=' + encodeURIComponent('꽃') +
    '&festival=jinhae'
  );
});

test('round-trip: parseQuery(serializeState(s)) === s', () => {
  const state = { month: 5, region: '경상남도', category: '꽃', festival: 'jinhae' };
  assert.deepEqual(parseQuery(serializeState(state)), state);
});
