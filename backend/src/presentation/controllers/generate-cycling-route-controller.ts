import type { NextFunction, Request, Response } from 'express';

import {
  GenerateCyclingRouteUseCase,
  RoundTripDistanceLimitError,
  RoutePlanNotFoundError,
} from '../../application/use-cases/GenerateCyclingRouteUseCase.js';
import { NoGeneratedWindRouteError } from '../../application/use-cases/GenerateWindOptimizedRouteUseCase.js';
import {
  RouteNotFoundError,
  RoutingProviderInvalidResponseError,
  RoutingProviderUnavailableError,
  RoutingRateLimitError,
} from '../../application/services/RoutingService.js';
import { WeatherForecastUnavailableError } from '../../application/services/WeatherService.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

export class GenerateCyclingRouteController {
  constructor(private readonly useCase: GenerateCyclingRouteUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const routePlanId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
      const result = await this.useCase.execute(routePlanId, (request as AuthenticatedRequest).authenticatedUser.userId);
      response.status(200).json({
        routePlanId: result.routePlanId,
        requestedDistanceKm: result.routePlan.distanceKm,
        requestedElevationGainM: result.routePlan.elevationGainM,
        favorableWindRequested: result.routePlan.favorableWind,
        actualDistanceKm: result.route.distanceM / 1000,
        durationSeconds: result.route.durationS,
        ascentM: result.route.ascentM,
        descentM: result.route.descentM,
        start: result.route.start,
        geometry: result.route.geometry,
        ...(result.optimization === undefined ? {} : {
          optimization: {
            candidateCount: result.optimization.candidateCount,
            selectedCandidate: result.optimization.selectedCandidate,
            selectionMode: result.optimization.selectionMode,
            wind: {
              speedKmh: result.optimization.weather.windSpeedKmh,
              gustKmh: result.optimization.weather.windGustKmh,
              directionDegrees: result.optimization.weather.windDirectionDegrees,
              directionCardinal: result.optimization.directionCardinal,
              riskLevel: result.optimization.riskLevel,
            },
            analysis: result.optimization.analysis,
            candidates: result.optimization.candidates,
          },
        }),
      });
    } catch (error) {
      if (error instanceof RoutePlanNotFoundError) { response.status(404).json({ message: 'Planificación no encontrada.' }); return; }
      if (error instanceof RoundTripDistanceLimitError) { response.status(422).json({ message: 'Actualmente la generación automática de rutas circulares está disponible hasta 100 km. Las rutas de mayor distancia se incorporarán en una fase posterior.' }); return; }
      if (error instanceof NoGeneratedWindRouteError) { response.status(503).json({ message: 'No se ha podido obtener ningún recorrido circular real en este momento. No se muestra una ruta inventada. Inténtalo de nuevo más tarde.' }); return; }
      if (error instanceof WeatherForecastUnavailableError) { response.status(422).json({ message: 'La previsión meteorológica todavía no está disponible para esta fecha.' }); return; }
      if (error instanceof RouteNotFoundError) { response.status(422).json({ message: 'No se ha encontrado un recorrido ciclista circular para esta planificación.' }); return; }
      if (error instanceof RoutingRateLimitError) { response.status(429).json({ message: 'El servicio de rutas está temporalmente limitado. Inténtalo de nuevo más tarde.' }); return; }
      if (error instanceof RoutingProviderUnavailableError) { response.status(503).json({ message: 'El servicio de rutas no está disponible temporalmente.' }); return; }
      if (error instanceof RoutingProviderInvalidResponseError) { response.status(502).json({ message: 'No se ha podido interpretar el recorrido generado.' }); return; }
      next(error);
    }
  };
}
