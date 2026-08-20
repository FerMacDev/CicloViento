import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import { RouteNotFoundError, type RoutingService } from '../services/RoutingService.js';
import type { WeatherService } from '../services/WeatherService.js';
import { WindRouteAnalyzer } from '../services/WindRouteAnalyzer.js';
import { classifyWindRisk, windDirectionCardinal } from '../services/WindRisk.js';

export class PlannedRouteNotFoundError extends Error {
  constructor() {
    super('Route plan was not found.');
  }
}

export class AnalyzePlannedRouteWindUseCase {
  constructor(
    private readonly repository: RoutePlanRepository,
    private readonly routing: RoutingService,
    private readonly weather: WeatherService,
    private readonly analyzer = new WindRouteAnalyzer(),
  ) {}

  async execute(id: string, userId: string) {
    const plan = await this.repository.findById(id);
    if (!plan || plan.userId !== userId) throw new PlannedRouteNotFoundError();

    const start = { latitude: plan.latitude, longitude: plan.longitude };
    const forecastPromise = this.weather.getWindForecast({
      latitude: plan.latitude,
      longitude: plan.longitude,
      date: plan.date,
      startTime: plan.startTime,
    });

    let route;
    try {
      route = await this.routing.generateRoundTrip({ start, targetDistanceKm: plan.distanceKm });
    } catch (error) {
      if (!(error instanceof RouteNotFoundError)) throw error;
      route = await this.routing.generateOutAndBack({ start, targetDistanceKm: plan.distanceKm });
    }

    const forecast = await forecastPromise;
    return {
      routePlanId: plan.id,
      wind: {
        speedKmh: forecast.windSpeedKmh,
        gustKmh: forecast.windGustKmh,
        directionDegrees: forecast.windDirectionDegrees,
        directionCardinal: windDirectionCardinal(forecast.windDirectionDegrees),
        riskLevel: classifyWindRisk(forecast),
      },
      analysis: this.analyzer.analyze(route, forecast),
    };
  }
}
