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

import { matchesRegion, matchesCategory, applyFilters } from '../js/filter.js';

test('matchesRegion: exact match', () => {
  const f = { region: '경상남도' };
  assert.equal(matchesRegion(f, '경상남도'), true);
  assert.equal(matchesRegion(f, '경상북도'), false);
});

test('matchesRegion: null filter matches all', () => {
  const f = { region: '경상남도' };
  assert.equal(matchesRegion(f, null), true);
});

test('matchesCategory: exact match', () => {
  const f = { category: '꽃' };
  assert.equal(matchesCategory(f, '꽃'), true);
  assert.equal(matchesCategory(f, '음식'), false);
});

test('matchesCategory: null filter matches all', () => {
  const f = { category: '꽃' };
  assert.equal(matchesCategory(f, null), true);
});

test('applyFilters: combines all filters with AND', () => {
  const festivals = [
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
    { id: 'b', startDate: '2026-05-10', endDate: '2026-05-15', region: '경상남도', category: '꽃' },
    { id: 'c', startDate: '2026-06-01', endDate: '2026-06-05', region: '경상남도', category: '꽃' },
  ];
  const result = applyFilters(festivals, { month: 5, region: '경상남도', category: null });
  assert.deepEqual(result.map(f => f.id), ['b']);
});

test('applyFilters: no filters returns all', () => {
  const festivals = [
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
    { id: 'b', startDate: '2026-06-01', endDate: '2026-06-05', region: '경상남도', category: '꽃' },
  ];
  const result = applyFilters(festivals, { month: null, region: null, category: null });
  assert.deepEqual(result.map(f => f.id), ['a', 'b']);
});

test('applyFilters: result sorted by startDate ascending', () => {
  const festivals = [
    { id: 'b', startDate: '2026-05-10', endDate: '2026-05-15', region: '경상남도', category: '꽃' },
    { id: 'a', startDate: '2026-05-01', endDate: '2026-05-05', region: '서울특별시', category: '음악' },
  ];
  const result = applyFilters(festivals, { month: 5, region: null, category: null });
  assert.deepEqual(result.map(f => f.id), ['a', 'b']);
});
