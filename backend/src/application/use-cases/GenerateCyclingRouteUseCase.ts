import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import type { GeneratedRoute, RoutingService } from '../services/RoutingService.js';
import { GenerateWindOptimizedRouteUseCase, type WindOptimizedRouteResult } from './GenerateWindOptimizedRouteUseCase.js';

export class RoutePlanNotFoundError extends Error {
  constructor() {
    super('Route plan was not found.');
    this.name = 'RoutePlanNotFoundError';
  }
}

export class RoundTripDistanceLimitError extends Error {
  constructor(maximumDistanceKm: number) {
    super(`Round trips are limited to ${maximumDistanceKm} km by the configured routing provider.`);
    this.name = 'RoundTripDistanceLimitError';
  }
}

export class GenerateCyclingRouteUseCase {
  constructor(
    private readonly routePlanRepository: RoutePlanRepository,
    private readonly routingService: RoutingService,
    private readonly windOptimizedRouteUseCase?: GenerateWindOptimizedRouteUseCase,
  ) {}

  async execute(routePlanId: string, authenticatedUserId: string): Promise<{ routePlanId: string; routePlan: { distanceKm: number; elevationGainM: number; favorableWind: boolean }; route: GeneratedRoute; optimization?: WindOptimizedRouteResult }> {
    const routePlan = await this.routePlanRepository.findById(routePlanId);

    // A missing plan and a plan owned by someone else are deliberately indistinguishable over HTTP.
    if (!routePlan || routePlan.userId !== authenticatedUserId) throw new RoutePlanNotFoundError();
    if (routePlan.distanceKm > this.routingService.maximumRoundTripDistanceKm) {
      throw new RoundTripDistanceLimitError(this.routingService.maximumRoundTripDistanceKm);
    }

    if (routePlan.favorableWind && this.windOptimizedRouteUseCase) {
      const optimization = await this.windOptimizedRouteUseCase.executeForRoutePlan(routePlan);
      return {
        routePlanId: routePlan.id,
        routePlan: { distanceKm: routePlan.distanceKm, elevationGainM: routePlan.elevationGainM, favorableWind: true },
        route: optimization.route,
        optimization,
      };
    }

    const route = await this.routingService.generateRoundTrip({
      start: { latitude: routePlan.latitude, longitude: routePlan.longitude },
      targetDistanceKm: routePlan.distanceKm,
    });

    return {
      routePlanId: routePlan.id,
      routePlan: {
        distanceKm: routePlan.distanceKm,
        elevationGainM: routePlan.elevationGainM,
        favorableWind: routePlan.favorableWind,
      },
      route,
    };
  }
}
