import type { NextFunction, Request, Response } from 'express';

import { WeatherForecastUnavailableError, WeatherProviderInvalidResponseError, WeatherProviderUnavailableError } from '../../application/services/WeatherService.js';
import { AnalyzePlannedRouteWindUseCase, PlannedRouteNotFoundError } from '../../application/use-cases/AnalyzePlannedRouteWindUseCase.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

export class AnalyzeRouteWindController {
  constructor(private readonly useCase: AnalyzePlannedRouteWindUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const routePlanId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
      response.json(await this.useCase.execute(routePlanId, (request as AuthenticatedRequest).authenticatedUser.userId));
    } catch (error) {
      if (error instanceof PlannedRouteNotFoundError) { response.status(404).json({ message: 'Planificación no encontrada.' }); return; }
      if (error instanceof WeatherForecastUnavailableError) { response.status(422).json({ message: 'La previsión meteorológica todavía no está disponible para esta fecha.' }); return; }
      if (error instanceof WeatherProviderUnavailableError || error instanceof WeatherProviderInvalidResponseError) { response.status(503).json({ message: 'El servicio meteorológico no está disponible temporalmente.' }); return; }
      next(error);
    }
  };
}
