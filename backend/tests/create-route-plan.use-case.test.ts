import assert from 'node:assert/strict';
import test from 'node:test';

import { CreateRoutePlanUseCase, RoutePlanLocationNotFoundError } from '../src/application/use-cases/CreateRoutePlanUseCase.js';
import { GeocodingUnavailableError } from '../src/application/services/GeocodingService.js';
import { RoutePlanValidationError } from '../src/domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../src/domain/repositories/RoutePlanRepository.js';
import type { RoutePlan } from '../src/domain/entities/RoutePlan.js';

class Repo implements RoutePlanRepository {
  saved?: RoutePlan;

  async save(plan: RoutePlan) { this.saved = plan; return plan; }
  async findById() { return this.saved ?? null; }
}

const geocoder = { geocode: async () => ({ latitude: 40.48, longitude: -3.36 }) };
const input = { userId: 'user-1', startLocation: 'Alcalá de Henares', date: '2099-08-25', startTime: '09:00', distanceKm: 80, elevationGainM: 700, favorableWind: true };

test('CreateRoutePlanUseCase persists valid preferences', async () => {
  const repo = new Repo();
  const result = await new CreateRoutePlanUseCase(repo, { generate: () => 'plan-1' }, geocoder).execute(input);
  assert.equal(result.latitude, 40.48);
  assert.equal(repo.saved?.userId, 'user-1');
  assert.equal(result.favorableWind, true);
});

test('CreateRoutePlanUseCase accepts planning limits', async () => {
  const useCase = new CreateRoutePlanUseCase(new Repo(), { generate: () => 'plan-1' }, geocoder);
  const minimum = await useCase.execute({ ...input, distanceKm: 10, elevationGainM: 0 });
  const maximum = await useCase.execute({ ...input, distanceKm: 300, elevationGainM: 5000 });

  assert.equal(minimum.distanceKm, 10);
  assert.equal(minimum.elevationGainM, 0);
  assert.equal(maximum.distanceKm, 300);
  assert.equal(maximum.elevationGainM, 5000);
});

for (const [name, invalid] of [
  ['empty location', { ...input, startLocation: '' }],
  ['invalid date', { ...input, date: '2099-02-30' }],
  ['past date', { ...input, date: '2000-01-01' }],
  ['invalid start time', { ...input, startTime: '25:00' }],
  ['low distance', { ...input, distanceKm: 9 }],
  ['high distance', { ...input, distanceKm: 301 }],
  ['negative elevation', { ...input, elevationGainM: -1 }],
  ['high elevation', { ...input, elevationGainM: 5001 }],
] as const) {
  test(`CreateRoutePlanUseCase rejects ${name} before geocoding`, async () => {
    let geocodingCalls = 0;
    const useCase = new CreateRoutePlanUseCase(new Repo(), { generate: () => 'plan-1' }, {
      geocode: async () => { geocodingCalls += 1; return { latitude: 40.48, longitude: -3.36 }; },
    });

    await assert.rejects(() => useCase.execute(invalid), RoutePlanValidationError);
    assert.equal(geocodingCalls, 0);
  });
}

test('CreateRoutePlanUseCase differentiates an unresolvable location', async () => {
  const useCase = new CreateRoutePlanUseCase(new Repo(), { generate: () => 'plan-1' }, { geocode: async () => null });
  await assert.rejects(() => useCase.execute(input), RoutePlanLocationNotFoundError);
});

test('CreateRoutePlanUseCase preserves a temporary geocoding failure', async () => {
  const useCase = new CreateRoutePlanUseCase(new Repo(), { generate: () => 'plan-1' }, {
    geocode: async () => { throw new GeocodingUnavailableError(); },
  });
  await assert.rejects(() => useCase.execute(input), GeocodingUnavailableError);
});
