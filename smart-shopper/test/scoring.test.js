import test from 'node:test';
import assert from 'node:assert/strict';
import { landedCost, adjustedRating, rankOffers } from '../src/scoring.js';
import { extractJson } from '../src/claude.js';

test('landed cost includes shipping and tax', () => {
  assert.equal(landedCost({ price: 100, shipping: 10 }, 0.1), 120);
  assert.equal(landedCost({ price: 50, shipping: null }), 50);
  assert.equal(landedCost({ price: null }), null);
});

test('low trust and few reviews pull a perfect rating down', () => {
  const sus = adjustedRating({ rating: 4.9, reviewCount: 80, trust: 0.2 });
  const solid = adjustedRating({ rating: 4.5, reviewCount: 8000, trust: 0.9 });
  assert.ok(solid > sus);
});

test('shipping can flip the cheapest item; fake-risk is penalised', () => {
  const ranked = rankOffers([
    { id: 'a', price: 30, shipping: 15, rating: 4.5, reviewCount: 5000, trust: 0.9, fakeRisk: 'low' },
    { id: 'b', price: 40, shipping: 0, rating: 4.5, reviewCount: 5000, trust: 0.9, fakeRisk: 'low' },
    { id: 'c', price: 20, shipping: 0, rating: 5, reviewCount: 20, trust: 0.1, fakeRisk: 'high' },
  ], { priority: 'balanced' });
  assert.equal(ranked.find(r => r.id === 'a').landed, 45);
  assert.ok(ranked.findIndex(r => r.id === 'b') < ranked.findIndex(r => r.id === 'a'));
  assert.notEqual(ranked[0].id, 'c');
});

test('extractJson handles fenced output', () => {
  assert.deepEqual(extractJson('here:\n```json\n{"a":1}\n```'), { a: 1 });
});
