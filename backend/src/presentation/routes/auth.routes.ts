import { Router } from 'express';

import type { TokenService } from '../../application/services/TokenService.js';
import type { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { AuthMeController } from '../controllers/auth-me-controller.js';
import { LoginUserController } from '../controllers/login-user-controller.js';
import { createAuthenticationMiddleware } from '../middlewares/authentication-middleware.js';

export function createAuthRouter(loginUserUseCase: LoginUserUseCase, tokenService: TokenService): Router {
  const router = Router();
  const loginUserController = new LoginUserController(loginUserUseCase);
  const authMeController = new AuthMeController();
  const authenticate = createAuthenticationMiddleware(tokenService);

  router.post('/auth/login', loginUserController.handle);
  router.get('/auth/me', authenticate, authMeController.handle);

  return router;
}
