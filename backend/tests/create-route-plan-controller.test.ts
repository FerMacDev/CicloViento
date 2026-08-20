import assert from 'node:assert/strict';
import test from 'node:test';

import { CreateRoutePlanController } from '../src/presentation/controllers/create-route-plan-controller.js';
import { RoutePlanValidationError } from '../src/domain/entities/RoutePlan.js';
import { GeocodingUnavailableError } from '../src/application/services/GeocodingService.js';
import { RoutePlanLocationNotFoundError } from '../src/application/use-cases/CreateRoutePlanUseCase.js';

function response() {
  let statusCode: number | undefined;
  let body: unknown;
  const value = {
    status: (code: number) => { statusCode = code; return value; },
    json: (payload: unknown) => { body = payload; },
  };
  return { value, get statusCode() { return statusCode; }, get body() { return body; } };
}

const request = {
  body: { startLocation: 'Madrid', date: '2099-08-25', startTime: '09:00', distanceKm: 80, elevationGainM: 700, favorableWind: false },
  authenticatedUser: { userId: 'user-1' },
};

for (const [field, message] of [
  ['startLocation', 'Indica un punto de partida.'],
  ['date', 'Indica una fecha de salida válida que no esté en el pasado.'],
  ['startTime', 'Indica una hora de salida válida.'],
  ['distanceKm', 'La distancia debe estar entre 10 y 300 km.'],
  ['elevationGainM', 'El desnivel acumulado debe estar entre 0 y 5.000 m.'],
] as const) {
  test(`create route plan controller maps ${field} validation errors safely`, async () => {
    const controller = new CreateRoutePlanController({
      execute: async () => { throw new RoutePlanValidationError(field, 'internal detail'); },
    } as never);
    const res = response();

    await controller.handle(request as never, res.value as never, () => {});

    assert.equal(res.statusCode, 422);
    assert.deepEqual(res.body, { message });
  });
}

test('create route plan controller differentiates an unresolvable location', async () => {
  const controller = new CreateRoutePlanController({
    execute: async () => { throw new RoutePlanLocationNotFoundError(); },
  } as never);
  const res = response();

  await controller.handle(request as never, res.value as never, () => {});

  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.body, { message: 'No se ha podido localizar el punto de partida.' });
});

test('create route plan controller maps a temporary geocoding outage to 503', async () => {
  const controller = new CreateRoutePlanController({
    execute: async () => { throw new GeocodingUnavailableError(); },
  } as never);
  const res = response();

  await controller.handle(request as never, res.value as never, () => {});

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { message: 'El servicio de localización no está disponible temporalmente.' });
});
