import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthsCovered, isInMonth } from '../js/filter.js';

test('monthsCovered: same month festival', () => {
  const f = { startDate: '2026-05-10', endDate: '2026-05-15' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [5]);
});

test('monthsCovered: spans two months', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [3, 4]);
});

test('monthsCovered: spans three months', () => {
  const f = { startDate: '2026-06-15', endDate: '2026-08-05' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [6, 7, 8]);
});

test('monthsCovered: wraps year boundary', () => {
  const f = { startDate: '2026-12-30', endDate: '2027-01-03' };
  assert.deepEqual([...monthsCovered(f)].sort((a,b)=>a-b), [1, 12]);
});

test('isInMonth: matches included month', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.equal(isInMonth(f, 3), true);
  assert.equal(isInMonth(f, 4), true);
});

test('isInMonth: rejects excluded month', () => {
  const f = { startDate: '2026-03-25', endDate: '2026-04-03' };
  assert.equal(isInMonth(f, 5), false);
});
