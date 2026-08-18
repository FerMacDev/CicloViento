import express, { type Express } from 'express';
import cors from 'cors';

import type { TokenService } from '../../application/services/TokenService.js';
import type { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import type { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase.js';
import type { GetAuthenticatedUserUseCase } from '../../application/use-cases/GetAuthenticatedUserUseCase.js';
import type { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import type { CreateRoutePlanUseCase } from '../../application/use-cases/CreateRoutePlanUseCase.js';
import type { GenerateCyclingRouteUseCase } from '../../application/use-cases/GenerateCyclingRouteUseCase.js';
import type { GetRouteWeatherUseCase } from '../../application/use-cases/GetRouteWeatherUseCase.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { createRoutePlansRouter } from '../routes/route-plans.routes.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { createAuthRouter } from '../routes/auth.routes.js';
import { createHealthRouter } from '../routes/health.routes.js';
import { createUsersRouter } from '../routes/users.routes.js';

export interface AppDependencies {
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase;
  tokenService: TokenService;
  createRoutePlanUseCase: CreateRoutePlanUseCase;
  generateCyclingRouteUseCase: GenerateCyclingRouteUseCase;
  getRouteWeatherUseCase: GetRouteWeatherUseCase;
  userRepository: UserRepository;
}

export function createApp(dependencies: AppDependencies, corsOrigin: string): Express {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(createHealthRouter());
  app.use(createUsersRouter(dependencies.registerUserUseCase));
  app.use(createAuthRouter(
    dependencies.loginUserUseCase,
    dependencies.changePasswordUseCase,
    dependencies.getAuthenticatedUserUseCase,
    dependencies.tokenService,
  ));
  app.use(createRoutePlansRouter(dependencies.createRoutePlanUseCase, dependencies.generateCyclingRouteUseCase, dependencies.getRouteWeatherUseCase, dependencies.tokenService, dependencies.userRepository));
  app.use(errorHandler);

  return app;
}
