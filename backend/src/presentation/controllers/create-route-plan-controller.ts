import type { NextFunction, Request, Response } from 'express';

import { RoutePlanValidationError, type RoutePlanValidationField } from '../../domain/entities/RoutePlan.js';
import { GeocodingUnavailableError } from '../../application/services/GeocodingService.js';
import { CreateRoutePlanUseCase, RoutePlanLocationNotFoundError, type CreateRoutePlanInput } from '../../application/use-cases/CreateRoutePlanUseCase.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

const validationMessages: Record<RoutePlanValidationField, string> = {
  startLocation: 'Indica un punto de partida.',
  date: 'Indica una fecha de salida válida que no esté en el pasado.',
  startTime: 'Indica una hora de salida válida.',
  distanceKm: 'La distancia debe estar entre 10 y 300 km.',
  elevationGainM: 'El desnivel acumulado debe estar entre 0 y 5.000 m.',
  coordinates: 'No se ha podido localizar el punto de partida.',
};

export class CreateRoutePlanController {
  constructor(private readonly useCase: CreateRoutePlanUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { startLocation, date, startTime, distanceKm, elevationGainM, favorableWind } = request.body as CreateRoutePlanInput;
      const plan = await this.useCase.execute({
        userId: (request as AuthenticatedRequest).authenticatedUser.userId,
        startLocation,
        date,
        startTime,
        distanceKm,
        elevationGainM,
        favorableWind,
      });
      response.status(201).json({
        id: plan.id,
        startLocation: plan.startLocation,
        date: plan.date,
        startTime: plan.startTime,
        distanceKm: plan.distanceKm,
        elevationGainM: plan.elevationGainM,
        favorableWind: plan.favorableWind,
        latitude: plan.latitude,
        longitude: plan.longitude,
        createdAt: plan.createdAt,
      });
    } catch (error) {
      if (error instanceof RoutePlanValidationError) {
        response.status(422).json({ message: validationMessages[error.field] });
        return;
      }
      if (error instanceof RoutePlanLocationNotFoundError) {
        response.status(422).json({ message: 'No se ha podido localizar el punto de partida.' });
        return;
      }
      if (error instanceof GeocodingUnavailableError) {
        response.status(503).json({ message: 'El servicio de localización no está disponible temporalmente.' });
        return;
      }
      next(error);
    }
  };
}
