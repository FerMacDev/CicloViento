import express, { type Express } from 'express';

import type { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { createHealthRouter } from '../routes/health.routes.js';
import { createUsersRouter } from '../routes/users.routes.js';

export function createApp(registerUserUseCase: RegisterUserUseCase): Express {
  const app = express();

  app.use(express.json());
  app.use(createHealthRouter());
  app.use(createUsersRouter(registerUserUseCase));
  app.use(errorHandler);

  return app;
}
