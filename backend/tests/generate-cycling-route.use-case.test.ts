import assert from 'node:assert/strict';
import test from 'node:test';

import { GenerateCyclingRouteUseCase, RoundTripDistanceLimitError, RoutePlanNotFoundError } from '../src/application/use-cases/GenerateCyclingRouteUseCase.js';
import type { GeneratedRoute, RoutingService } from '../src/application/services/RoutingService.js';
import { RoutePlan } from '../src/domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../src/domain/repositories/RoutePlanRepository.js';

const plan = RoutePlan.create({ id: 'plan-1', userId: 'user-1', startLocation: 'Alcalá de Henares', date: '2099-08-25', startTime: '09:00', distanceKm: 80, elevationGainM: 700, favorableWind: true, latitude: 40.48, longitude: -3.36, createdAt: new Date() });
class Repo implements RoutePlanRepository { constructor(private readonly value: RoutePlan | null) {} async save(routePlan: RoutePlan) { return routePlan; } async findById() { return this.value; } }
class Router implements RoutingService { readonly maximumRoundTripDistanceKm = 100; calls = 0; async generateRoundTrip(): Promise<GeneratedRoute> { this.calls += 1; return { start: { latitude: 40.48, longitude: -3.36 }, geometry: [{ latitude: 40.48, longitude: -3.36 }, { latitude: 40.49, longitude: -3.35 }], distanceM: 78_900, durationS: 14_400, ascentM: 690 }; } }

test('GenerateCyclingRouteUseCase returns a provider-independent route for its owner', async () => {
  const router = new Router(); const result = await new GenerateCyclingRouteUseCase(new Repo(plan), router).execute('plan-1', 'user-1');
  assert.equal(router.calls, 1); assert.equal(result.routePlanId, 'plan-1'); assert.equal(result.route.distanceM, 78_900); assert.equal(result.routePlan.favorableWind, true);
});
test('GenerateCyclingRouteUseCase hides missing and foreign plans and rejects distances above provider capability', async () => {
  await assert.rejects(() => new GenerateCyclingRouteUseCase(new Repo(null), new Router()).execute('missing', 'user-1'), RoutePlanNotFoundError);
  await assert.rejects(() => new GenerateCyclingRouteUseCase(new Repo(plan), new Router()).execute('plan-1', 'other-user'), RoutePlanNotFoundError);
  const longPlan = RoutePlan.create({ ...plan, distanceKm: 101 });
  await assert.rejects(() => new GenerateCyclingRouteUseCase(new Repo(longPlan), new Router()).execute('plan-1', 'user-1'), RoundTripDistanceLimitError);
});
