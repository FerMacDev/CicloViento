import assert from 'node:assert/strict';
import test from 'node:test';

import { GeocodingUnavailableError } from '../src/application/services/GeocodingService.js';
import { NominatimGeocodingService } from '../src/infrastructure/geocoding/nominatim-geocoding-service.js';

const originalFetch = globalThis.fetch;
function response(body: unknown, ok = true): Response { return { ok, json: async () => body } as Response; }

test('NominatimGeocodingService parses coordinates and sends the expected request', async () => {
  let url = ''; let options: RequestInit | undefined;
  globalThis.fetch = async (input, init) => { url = String(input); options = init; return response([{ lat: '40.48', lon: '-3.36', display_name: 'Alcalá de Henares, España' }]); };
  const result = await new NominatimGeocodingService('https://geo.example', 'CicloViento/1.0').geocode('Alcalá de Henares');
  assert.deepEqual(result, { latitude: 40.48, longitude: -3.36, displayName: 'Alcalá de Henares, España' });
  assert.match(url, /format=jsonv2/); assert.match(url, /limit=1/); assert.match(url, /Alcal%C3%A1%20de%20Henares/);
  assert.equal((options?.headers as Record<string, string>)['User-Agent'], 'CicloViento/1.0'); globalThis.fetch = originalFetch;
});
test('NominatimGeocodingService returns null for an empty response and caches equivalent queries', async () => {
  let calls = 0; globalThis.fetch = async () => { calls += 1; return response([]); };
  const service = new NominatimGeocodingService('https://geo.example', 'CicloViento/1.0');
  assert.equal(await service.geocode(' Alcalá '), null); assert.equal(await service.geocode('alcalá'), null); assert.equal(calls, 1); globalThis.fetch = originalFetch;
});
test('NominatimGeocodingService maps HTTP and timeout failures to provider error', async () => {
  globalThis.fetch = async () => response([], false); const service = new NominatimGeocodingService('https://geo.example', 'CicloViento/1.0');
  await assert.rejects(() => service.geocode('Madrid'), GeocodingUnavailableError);
  globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError'); };
  await assert.rejects(() => new NominatimGeocodingService('https://geo.example', 'CicloViento/1.0').geocode('Madrid'), GeocodingUnavailableError); globalThis.fetch = originalFetch;
});
