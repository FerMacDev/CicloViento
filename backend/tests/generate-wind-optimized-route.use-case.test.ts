import assert from 'node:assert/strict';
import test from 'node:test';

import { GenerateCyclingRouteUseCase } from '../src/application/use-cases/GenerateCyclingRouteUseCase.js';
import {
  GenerateWindOptimizedRouteUseCase,
  NoViableWindRouteError,
  WindOptimizedRouteNotFoundError,
} from '../src/application/use-cases/GenerateWindOptimizedRouteUseCase.js';
import type { GeneratedRoute, RoutingService } from '../src/application/services/RoutingService.js';
import type { WeatherService } from '../src/application/services/WeatherService.js';
import type { RoutePlanRepository } from '../src/domain/repositories/RoutePlanRepository.js';
import { RoutePlan } from '../src/domain/entities/RoutePlan.js';

const plan = RoutePlan.create({
  id: 'plan-1', userId: 'user-1', startLocation: 'Madrid', date: '2099-01-01',
  distanceKm: 50, elevationGainM: 700, favorableWind: true, latitude: 40.4, longitude: -3.7, createdAt: new Date(),
});

class Repository implements RoutePlanRepository {
  constructor(private readonly routePlan: RoutePlan | null) {}
  async save(routePlan: RoutePlan): Promise<RoutePlan> { return routePlan; }
  async findById(): Promise<RoutePlan | null> { return this.routePlan; }
}

class RoutingFake implements RoutingService {
  readonly maximumRoundTripDistanceKm = 100;
  readonly calls: number[] = [];
  constructor(private readonly distances: Record<number, number>, private readonly failures: number[] = []) {}
  async generateRoundTrip(input: { seed?: number }): Promise<GeneratedRoute> {
    const seed = input.seed ?? 1;
    this.calls.push(seed);
    if (this.failures.includes(seed)) throw new Error('provider failed');
    return {
      start: { latitude: 0, longitude: 0 },
      geometry: [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: seed }],
      distanceM: this.distances[seed] * 1000,
      durationS: 3600,
      ascentM: 500,
    };
  }
}

class WeatherFake implements WeatherService {
  calls = 0;
  async getWindForecast() {
    this.calls += 1;
    return { dateTime: '2099-01-01T09:00', windSpeedKmh: 20, windDirectionDegrees: 270, windGustKmh: 25 };
  }
}

function analyzer(scores: Record<number, number>) {
  return {
    analyze(route: GeneratedRoute) {
      const score = scores[Math.round(route.geometry[1].longitude)];
      return {
        analyzedDistanceM: route.distanceM, tailwindDistanceM: 0, headwindDistanceM: 0, crosswindDistanceM: 0,
        tailwindPercent: 0, headwindPercent: 0, crosswindPercent: 0,
        returnTailwindDistanceM: score, returnHeadwindDistanceM: 100 - score, returnCrosswindDistanceM: 0,
        returnTailwindPercent: score, returnHeadwindPercent: 100 - score, returnCrosswindPercent: 0,
        averageLongitudinalComponentKmh: 0, averageCrosswindComponentKmh: 0, maxCrosswindComponentKmh: 0,
        favorableWindScore: score, windSpeedKmh: 20, windGustKmh: 25, windDirectionDegrees: 270,
      };
    },
  };
}

function createUseCase(distances: Record<number, number>, scores: Record<number, number>, failures: number[] = []) {
  const routing = new RoutingFake(distances, failures);
  const weather = new WeatherFake();
  const useCase = new GenerateWindOptimizedRouteUseCase(new Repository(plan), routing, weather, analyzer(scores) as never);
  return { useCase, routing, weather };
}

test('selects the candidate with the greatest favorable score and requests weather once', async () => {
  const { useCase, routing, weather } = createUseCase({ 1: 48, 2: 50, 3: 52 }, { 1: 40, 2: 80, 3: 60 });
  const result = await useCase.execute('plan-1', 'user-1');
  assert.equal(result.selectedCandidate, 2);
  assert.equal(result.candidateCount, 3);
  assert.equal(result.candidates.find((candidate) => candidate.selected)?.seed, 2);
  assert.deepEqual(routing.calls, [1, 2, 3]);
  assert.equal(weather.calls, 1);
});

test('breaks score ties by distance difference and then seed', async () => {
  const first = createUseCase({ 1: 48, 2: 51, 3: 52 }, { 1: 70, 2: 70, 3: 60 });
  assert.equal((await first.useCase.execute('plan-1', 'user-1')).selectedCandidate, 2);
  const second = createUseCase({ 1: 49, 2: 51, 3: 52 }, { 1: 70, 2: 70, 3: 60 });
  assert.equal((await second.useCase.execute('plan-1', 'user-1')).selectedCandidate, 1);
});

test('continues after partial provider failures and accepts one valid candidate', async () => {
  const { useCase } = createUseCase({ 1: 50, 2: 50, 3: 50 }, { 1: 20, 2: 90, 3: 60 }, [1, 3]);
  const result = await useCase.execute('plan-1', 'user-1');
  assert.equal(result.candidateCount, 1);
  assert.equal(result.selectedCandidate, 2);
});

test('rejects all failed or distance-incoherent candidates without leaking provider details', async () => {
  const failed = createUseCase({ 1: 50, 2: 50, 3: 50 }, { 1: 1, 2: 1, 3: 1 }, [1, 2, 3]);
  await assert.rejects(() => failed.useCase.execute('plan-1', 'user-1'), NoViableWindRouteError);
  const outsideTolerance = createUseCase({ 1: 35, 2: 65, 3: 80 }, { 1: 99, 2: 99, 3: 99 });
  await assert.rejects(() => outsideTolerance.useCase.execute('plan-1', 'user-1'), NoViableWindRouteError);
});

test('keeps ownership failures indistinguishable from a missing route plan', async () => {
  const { useCase: existing } = createUseCase({ 1: 50, 2: 50, 3: 50 }, { 1: 1, 2: 1, 3: 1 });
  await assert.rejects(() => existing.execute('plan-1', 'other-user'), WindOptimizedRouteNotFoundError);
  const missing = new GenerateWindOptimizedRouteUseCase(new Repository(null), new RoutingFake({}), new WeatherFake(), analyzer({}) as never);
  await assert.rejects(() => missing.execute('missing', 'user-1'), WindOptimizedRouteNotFoundError);
});

test('does not use the optimization flow for a plan without favorable wind', async () => {
  const normalPlan = RoutePlan.create({ ...plan, id: 'normal', favorableWind: false });
  const routing = new RoutingFake({ 1: 50, 2: 50, 3: 50 });
  const result = await new GenerateCyclingRouteUseCase(new Repository(normalPlan), routing).execute('normal', 'user-1');
  assert.equal(result.optimization, undefined);
  assert.deepEqual(routing.calls, [1]);
});
