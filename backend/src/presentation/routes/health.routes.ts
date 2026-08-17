import { Router } from 'express';

import { CheckHealthUseCase } from '../../application/use-cases/CheckHealthUseCase.js';
import { HealthCheckController } from '../controllers/health-check-controller.js';

export function createHealthRouter(): Router {
  const router = Router();
  const checkHealthUseCase = new CheckHealthUseCase();
  const healthCheckController = new HealthCheckController(checkHealthUseCase);

  router.get('/health', healthCheckController.handle);

  return router;
}
