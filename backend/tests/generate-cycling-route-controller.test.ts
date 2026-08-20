import assert from 'node:assert/strict';
import test from 'node:test';

import { GenerateCyclingRouteController } from '../src/presentation/controllers/generate-cycling-route-controller.js';
import { WeatherForecastUnavailableError } from '../src/application/services/WeatherService.js';

function response() {
  let statusCode: number | undefined;
  let body: unknown;
  const value = { status: (code: number) => { statusCode = code; return value; }, json: (payload: unknown) => { body = payload; } };
  return { value, get statusCode() { return statusCode; }, get body() { return body; } };
}

test('generate route controller exposes only the optimized route summary', async () => {
  const result = {
    routePlanId: 'plan', routePlan: { distanceKm: 50, elevationGainM: 700, favorableWind: true },
    route: { start: { latitude: 0, longitude: 0 }, geometry: [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }], distanceM: 50_000, durationS: 3_600 },
    optimization: {
      candidateCount: 2, selectedCandidate: 2, selectionMode: 'wind-optimized',
      weather: { windSpeedKmh: 20, windGustKmh: 25, windDirectionDegrees: 270 }, directionCardinal: 'W', riskLevel: 'caution',
      analysis: { favorableWindScore: 70 },
      candidates: [{ seed: 1, actualDistanceKm: 49, favorableWindScore: 50, returnTailwindPercent: 50, returnHeadwindPercent: 40, returnCrosswindPercent: 10, withinDistanceTolerance: true, selected: false }],
    },
  };
  const controller = new GenerateCyclingRouteController({ execute: async () => result } as never);
  const res = response();
  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});
  const payload = res.body as Record<string, unknown>;
  assert.equal((payload.optimization as Record<string, unknown>).candidateCount, 2);
  assert.equal((payload.optimization as Record<string, unknown>).selectionMode, 'wind-optimized');
  assert.equal('apiKey' in payload, false);
  assert.equal(JSON.stringify(payload).includes('OpenRouteService'), false);
});

test('generate route controller returns the controlled message when no real wind candidate exists', async () => {
  const { NoGeneratedWindRouteError } = await import('../src/application/use-cases/GenerateWindOptimizedRouteUseCase.js');
  const controller = new GenerateCyclingRouteController({ execute: async () => { throw new NoGeneratedWindRouteError(); } } as never);
  const res = response();

  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { message: 'No se ha podido obtener ningún recorrido circular real en este momento. No se muestra una ruta inventada. Inténtalo de nuevo más tarde.' });
});

test('generate route controller returns the weather forecast message for a future date', async () => {
  const controller = new GenerateCyclingRouteController({ execute: async () => { throw new WeatherForecastUnavailableError(); } } as never);
  const res = response();
  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});
  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.body, { message: 'La previsión meteorológica todavía no está disponible para esta fecha.' });
});

test('generate route controller exposes a safe weather-unavailable fallback without wind scores', async () => {
  const controller = new GenerateCyclingRouteController({ execute: async () => ({
    routePlanId: 'plan', routePlan: { distanceKm: 50, elevationGainM: 700, favorableWind: true },
    route: { start: { latitude: 0, longitude: 0 }, geometry: [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }], distanceM: 50_000, durationS: 3_600 },
    optimization: { candidateCount: 1, selectionMode: 'weather-unavailable', candidates: [] },
  }) } as never);
  const res = response();
  await controller.handle({ params: { id: 'plan' }, authenticatedUser: { userId: 'user' } } as never, res.value as never, () => {});
  const optimization = (res.body as { optimization: Record<string, unknown> }).optimization;
  assert.equal(optimization.selectionMode, 'weather-unavailable');
  assert.equal('wind' in optimization, false);
  assert.equal('analysis' in optimization, false);
});
