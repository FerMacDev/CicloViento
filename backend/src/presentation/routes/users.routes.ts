import { Router } from 'express';

import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { RegisterUserController } from '../controllers/register-user-controller.js';

export function createUsersRouter(registerUserUseCase: RegisterUserUseCase): Router {
  const router = Router();
  const registerUserController = new RegisterUserController(registerUserUseCase);

  router.post('/users/register', registerUserController.handle);

  return router;
}
