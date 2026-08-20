import assert from 'node:assert/strict';
import test from 'node:test';

import { getWindTravelDirection, selectWindArrowPoints } from '../src/components/wind-direction';

test('converts meteorological direction into wind travel direction', () => {
  assert.equal(getWindTravelDirection(0), 180);
  assert.equal(getWindTravelDirection(90), 270);
  assert.equal(getWindTravelDirection(180), 0);
  assert.equal(getWindTravelDirection(270), 90);
  assert.equal(getWindTravelDirection(350), 170);
  assert.equal(getWindTravelDirection(360), 180);
  assert.equal(getWindTravelDirection(-90), 90);
});

test('selects a bounded set of real interior route points without mutating geometry', () => {
  const geometry = Array.from({ length: 25 }, (_, index) => ({ latitude: 40 + index / 1000, longitude: -3 - index / 1000 }));
  const snapshot = structuredClone(geometry);
  const selected = selectWindArrowPoints(geometry, 7);

  assert.equal(selected.length, 7);
  assert.deepEqual(geometry, snapshot);
  assert.equal(selected.every((point) => geometry.includes(point)), true);
  assert.equal(new Set(selected).size, 7);
});

test('handles small and empty geometries safely', () => {
  assert.deepEqual(selectWindArrowPoints([], 7), []);
  assert.deepEqual(selectWindArrowPoints([{ latitude: 1, longitude: 1 }], 7), []);
  assert.deepEqual(selectWindArrowPoints([{ latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }], 7), []);
  assert.equal(selectWindArrowPoints([{ latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }, { latitude: 3, longitude: 3 }], 7).length, 1);
});
