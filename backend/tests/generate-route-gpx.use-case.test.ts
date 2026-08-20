import assert from 'node:assert/strict';
import test from 'node:test';

import { GenerateRouteGpxUseCase } from '../src/application/use-cases/GenerateRouteGpxUseCase.js';
import { RoutePlanNotFoundError } from '../src/application/use-cases/GenerateCyclingRouteUseCase.js';

const route = {
  start: { latitude: 40.48, longitude: -3.36 },
  geometry: [{ latitude: 40.48, longitude: -3.36 }, { latitude: 40.49, longitude: -3.35 }],
  distanceM: 2_000,
  durationS: 300,
};

function generated(favorableWind: boolean) {
  return { routePlanId: 'plan', routePlan: { startLocation: 'Alcalá de Henares', date: '2026-08-25', startTime: '09:00', distanceKm: 40, elevationGainM: 500, favorableWind }, route };
}

test('GenerateRouteGpxUseCase reuses the normal route result and returns safe GPX data', async () => {
  const calls: string[][] = [];
  const useCase = new GenerateRouteGpxUseCase(
    { execute: async (...args: string[]) => { calls.push(args); return generated(false); } } as never,
    { generate: ({ route: selectedRoute }: { route: typeof route }) => `<gpx points="${selectedRoute.geometry.length}"/>` },
    () => new Date('2026-08-25T10:00:00.000Z'),
  );
  const result = await useCase.execute('plan', 'user');
  assert.deepEqual(calls, [['plan', 'user']]);
  assert.equal(result.filename, 'cicloviento-alcala-de-henares-2026-08-25.gpx');
  assert.equal(result.content, '<gpx points="2"/>');
  assert.equal(result.content.includes('user'), false);
});

test('GenerateRouteGpxUseCase reuses the route selected by the favorable-wind flow', async () => {
  const selectedRoute = { ...route, geometry: [{ latitude: 1, longitude: 2 }, { latitude: 3, longitude: 4 }] };
  const useCase = new GenerateRouteGpxUseCase(
    { execute: async () => ({ ...generated(true), route: selectedRoute, optimization: { selectedCandidate: 2 } }) } as never,
    { generate: ({ route: value }: { route: typeof selectedRoute }) => String(value.geometry[0].latitude) },
  );
  assert.equal((await useCase.execute('plan', 'user')).content, '1');
});

test('GenerateRouteGpxUseCase propagates controlled generation and ownership errors', async () => {
  const unavailable = new Error('routing unavailable');
  const useCase = new GenerateRouteGpxUseCase({ execute: async () => { throw unavailable; } } as never, { generate: () => '' });
  await assert.rejects(() => useCase.execute('plan', 'user'), unavailable);
  const missing = new GenerateRouteGpxUseCase({ execute: async () => { throw new RoutePlanNotFoundError(); } } as never, { generate: () => '' });
  await assert.rejects(() => missing.execute('plan', 'user'), RoutePlanNotFoundError);
});
