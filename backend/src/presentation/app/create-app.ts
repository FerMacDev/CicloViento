import express, { type Express } from 'express';

import type { TokenService } from '../../application/services/TokenService.js';
import type { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import type { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase.js';
import type { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { createAuthRouter } from '../routes/auth.routes.js';
import { createHealthRouter } from '../routes/health.routes.js';
import { createUsersRouter } from '../routes/users.routes.js';

export interface AppDependencies {
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  tokenService: TokenService;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();

  app.use(express.json());
  app.use(createHealthRouter());
  app.use(createUsersRouter(dependencies.registerUserUseCase));
  app.use(createAuthRouter(
    dependencies.loginUserUseCase,
    dependencies.changePasswordUseCase,
    dependencies.tokenService,
  ));
  app.use(errorHandler);

  return app;
}
