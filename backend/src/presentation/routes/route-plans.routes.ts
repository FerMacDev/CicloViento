import { Router } from 'express';
import type { CreateRoutePlanUseCase } from '../../application/use-cases/CreateRoutePlanUseCase.js';
import type { TokenService } from '../../application/services/TokenService.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { CreateRoutePlanController } from '../controllers/create-route-plan-controller.js';
import { GenerateCyclingRouteController } from '../controllers/generate-cycling-route-controller.js';
import { GetRouteWeatherController } from '../controllers/get-route-weather-controller.js';
import { AnalyzeRouteWindController } from '../controllers/analyze-route-wind-controller.js';
import { GenerateRouteGpxController } from '../controllers/generate-route-gpx-controller.js';
import type { AnalyzePlannedRouteWindUseCase } from '../../application/use-cases/AnalyzePlannedRouteWindUseCase.js';
import type { GenerateCyclingRouteUseCase } from '../../application/use-cases/GenerateCyclingRouteUseCase.js';
import type { GetRouteWeatherUseCase } from '../../application/use-cases/GetRouteWeatherUseCase.js';
import type { GenerateRouteGpxUseCase } from '../../application/use-cases/GenerateRouteGpxUseCase.js';
import { createAuthenticationMiddleware } from '../middlewares/authentication-middleware.js';
import { createMustChangePasswordGuard } from '../middlewares/must-change-password-guard.js';
export function createRoutePlansRouter(
  createRoutePlanUseCase: CreateRoutePlanUseCase,
  generateCyclingRouteUseCase: GenerateCyclingRouteUseCase,
  getRouteWeatherUseCase: GetRouteWeatherUseCase,
  analyzePlannedRouteWindUseCase: AnalyzePlannedRouteWindUseCase,
  generateRouteGpxUseCase: GenerateRouteGpxUseCase,
  tokenService: TokenService,
  userRepository: UserRepository,
): Router {
  const router = Router();
  const authenticate = createAuthenticationMiddleware(tokenService);
  const requireChangedPassword = createMustChangePasswordGuard(userRepository);
  router.post('/route-plans', authenticate, requireChangedPassword, new CreateRoutePlanController(createRoutePlanUseCase).handle);
  router.post('/route-plans/:id/generate', authenticate, requireChangedPassword, new GenerateCyclingRouteController(generateCyclingRouteUseCase).handle);
  router.get('/route-plans/:id/weather', authenticate, requireChangedPassword, new GetRouteWeatherController(getRouteWeatherUseCase).handle);
  router.post('/route-plans/:id/wind-analysis', authenticate, requireChangedPassword, new AnalyzeRouteWindController(analyzePlannedRouteWindUseCase).handle);
  router.get('/route-plans/:id/gpx', authenticate, requireChangedPassword, new GenerateRouteGpxController(generateRouteGpxUseCase).handle);
  return router;
}
