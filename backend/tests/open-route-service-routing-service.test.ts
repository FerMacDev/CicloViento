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

test('OpenRouteServiceRoutingService maps provider failures and malformed GeoJSON to controlled errors', async () => {
  globalThis.fetch = async () => response({}, 404);
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RouteNotFoundError);
  globalThis.fetch = async () => response({ features: [] });
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderInvalidResponseError);
  globalThis.fetch = async () => response({}, 503);
  await assert.rejects(() => new OpenRouteServiceRoutingService('test-key').generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderUnavailableError);
  await assert.rejects(() => new OpenRouteServiceRoutingService(undefined).generateRoundTrip({ start: { latitude: 40, longitude: -3 }, targetDistanceKm: 40 }), RoutingProviderUnavailableError);
  globalThis.fetch = originalFetch;
});
