import { Router } from 'express';

import type { TokenService } from '../../application/services/TokenService.js';
import type { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase.js';
import type { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { ChangePasswordController } from '../controllers/change-password-controller.js';
import { AuthMeController } from '../controllers/auth-me-controller.js';
import { LoginUserController } from '../controllers/login-user-controller.js';
import { createAuthenticationMiddleware } from '../middlewares/authentication-middleware.js';

export function createAuthRouter(
  loginUserUseCase: LoginUserUseCase,
  changePasswordUseCase: ChangePasswordUseCase,
  tokenService: TokenService,
): Router {
  const router = Router();
  const loginUserController = new LoginUserController(loginUserUseCase);
  const authMeController = new AuthMeController();
  const changePasswordController = new ChangePasswordController(changePasswordUseCase);
  const authenticate = createAuthenticationMiddleware(tokenService);

  router.post('/auth/login', loginUserController.handle);
  router.get('/auth/me', authenticate, authMeController.handle);
  router.post('/auth/change-password', authenticate, changePasswordController.handle);

  return router;
}
