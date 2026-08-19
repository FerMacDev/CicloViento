import type { NextFunction, Request, Response } from 'express';

import { GpxGenerationError } from '../../application/services/GpxGenerator.js';
import {
  RouteNotFoundError,
  RoutingProviderInvalidResponseError,
  RoutingProviderUnavailableError,
  RoutingRateLimitError,
} from '../../application/services/RoutingService.js';
import {
  WeatherForecastUnavailableError,
  WeatherProviderInvalidResponseError,
  WeatherProviderUnavailableError,
} from '../../application/services/WeatherService.js';
import {
  GenerateCyclingRouteUseCase,
  RoundTripDistanceLimitError,
  RoutePlanNotFoundError,
} from '../../application/use-cases/GenerateCyclingRouteUseCase.js';
import { GenerateRouteGpxUseCase } from '../../application/use-cases/GenerateRouteGpxUseCase.js';
import { NoGeneratedWindRouteError } from '../../application/use-cases/GenerateWindOptimizedRouteUseCase.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

export class GenerateRouteGpxController {
  constructor(private readonly useCase: GenerateRouteGpxUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const routePlanId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
      const result = await this.useCase.execute(routePlanId, (request as AuthenticatedRequest).authenticatedUser.userId);
      response.status(200);
      response.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
      response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      response.send(result.content);
    } catch (error) {
      if (error instanceof RoutePlanNotFoundError) { response.status(404).json({ message: 'Planificación no encontrada.' }); return; }
      if (error instanceof RoundTripDistanceLimitError) { response.status(422).json({ message: 'Actualmente la generación automática de rutas circulares está disponible hasta 100 km.' }); return; }
      if (error instanceof NoGeneratedWindRouteError) { response.status(503).json({ message: 'No se ha podido obtener ningún recorrido circular real en este momento. No se muestra una ruta inventada. Inténtalo de nuevo más tarde.' }); return; }
      if (error instanceof RouteNotFoundError) { response.status(422).json({ message: 'No se ha encontrado un recorrido ciclista circular para esta planificación.' }); return; }
      if (error instanceof RoutingRateLimitError) { response.status(429).json({ message: 'El servicio de rutas está temporalmente limitado. Inténtalo de nuevo más tarde.' }); return; }
      if (error instanceof RoutingProviderUnavailableError || error instanceof WeatherProviderUnavailableError || error instanceof WeatherProviderInvalidResponseError) { response.status(503).json({ message: 'El servicio necesario para generar el GPX no está disponible temporalmente.' }); return; }
      if (error instanceof RoutingProviderInvalidResponseError || error instanceof GpxGenerationError || error instanceof WeatherForecastUnavailableError) { response.status(502).json({ message: 'No se ha podido generar el archivo GPX.' }); return; }
      next(error);
    }
  };
}
