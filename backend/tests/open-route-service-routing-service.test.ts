import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RouteNotFoundError,
  RoutingProviderInvalidResponseError,
  RoutingProviderUnavailableError,
} from '../src/application/services/RoutingService.js';
import { OpenRouteServiceRoutingService } from '../src/infrastructure/routing/open-route-service-routing-service.js';

const originalFetch = globalThis.fetch;
function response(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
const validGeoJson = {
  features: [{
    geometry: { type: 'LineString', coordinates: [[-3.36, 40.48, 600], [-3.35, 40.49, 610]] },
    properties: { summary: { distance: 40_100, duration: 7_200 }, ascent: 510, descent: 510 },
  }],
};

test('OpenRouteServiceRoutingService requests cycling-road GeoJSON and converts coordinates', async () => {
  let url = ''; let options: RequestInit | undefined;
  globalThis.fetch = async (input, init) => { url = String(input); options = init; return response(validGeoJson); };
  const result = await new OpenRouteServiceRoutingService('test-key', 'https://ors.example').generateRoundTrip({ start: { latitude: 40.48, longitude: -3.36 }, targetDistanceKm: 40 });
  assert.equal(url, 'https://ors.example/v2/directions/cycling-road/geojson');
  assert.equal((options?.headers as Record<string, string>).Authorization, 'test-key');
  const body = JSON.parse(String(options?.body));
  assert.deepEqual(body.coordinates, [[-3.36, 40.48]]);
  assert.deepEqual(body.options.round_trip, { length: 40_000, points: 4, seed: 1 });
  assert.deepEqual(body.options.avoid_features, ['ferries', 'steps']);
  assert.deepEqual(result.geometry, [{ latitude: 40.48, longitude: -3.36 }, { latitude: 40.49, longitude: -3.35 }]);
  assert.equal(result.distanceM, 40_100); assert.equal(result.durationS, 7_200); assert.equal(result.ascentM, 510); assert.equal(result.descentM, 510);
  globalThis.fetch = originalFetch;
});

test('OpenRouteServiceRoutingService forwards deterministic candidate seeds without changing options', async () => {
  const seeds = [1, 2, 3];
  for (const seed of seeds) {
    let options: RequestInit | undefined;
    globalThis.fetch = async (_input, init) => { options = init; return response(validGeoJson); };
    await new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40, seed });
    const body = JSON.parse(String(options?.body));
    assert.equal(body.options.round_trip.seed, seed);
    assert.equal(body.options.round_trip.points, 4);
    assert.deepEqual(body.options.avoid_features, ['ferries', 'steps']);
  }
  globalThis.fetch = originalFetch;
});

test('OpenRouteServiceRoutingService builds an out-and-back route from two separately routed legs', async () => {
  const requests: Array<{ coordinates: [number, number][] }> = [];
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { coordinates: [number, number][] };
    requests.push(body);
    return response({
      features: [{
        geometry: { type: 'LineString', coordinates: body.coordinates },
        properties: { summary: { distance: 25_000, duration: 3_600 }, ascent: 250, descent: 250 },
      }],
    });
  };
  const start = { latitude: 40.48, longitude: -3.36 };
  const result = await new OpenRouteServiceRoutingService('test-key').generateOutAndBack({ start, targetDistanceKm: 50 });

  assert.equal(requests.length, 2);
  assert.deepEqual(requests[0].coordinates[0], [-3.36, 40.48]);
  assert.deepEqual(requests[1].coordinates[1], [-3.36, 40.48]);
  assert.equal(result.distanceM, 50_000);
  assert.equal(result.durationS, 7_200);
  assert.deepEqual(result.geometry[0], start);
  assert.deepEqual(result.geometry.at(-1), start);
  globalThis.fetch = originalFetch;
});

test('OpenRouteServiceRoutingService limits an unavailable out-and-back destination search to three real attempts', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return response({}, 404); };

  await assert.rejects(
    () => new OpenRouteServiceRoutingService('test-key').generateOutAndBack({ start: { latitude: 40.48, longitude: -3.36 }, targetDistanceKm: 50 }),
    RouteNotFoundError,
  );

  assert.equal(calls, 3);
  globalThis.fetch = originalFetch;
});

test('OpenRouteServiceRoutingService maps provider failures and malformed GeoJSON to controlled errors', async () => {
  globalThis.fetch = async () => response({}, 404);
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RouteNotFoundError);
  globalThis.fetch = async () => response({}, 400);
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderInvalidResponseError);
  globalThis.fetch = async () => response({ features: [] });
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderInvalidResponseError);
  globalThis.fetch = async () => response({}, 503);
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderUnavailableError);
  await assert.rejects(() => new OpenRouteServiceRoutingService(undefined).generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderUnavailableError);
  globalThis.fetch = originalFetch;
});
