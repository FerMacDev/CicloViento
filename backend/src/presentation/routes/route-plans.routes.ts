import { Router } from 'express';
import type { CreateRoutePlanUseCase } from '../../application/use-cases/CreateRoutePlanUseCase.js';
import type { TokenService } from '../../application/services/TokenService.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { CreateRoutePlanController } from '../controllers/create-route-plan-controller.js';
import { createAuthenticationMiddleware } from '../middlewares/authentication-middleware.js';
import { createMustChangePasswordGuard } from '../middlewares/must-change-password-guard.js';
export function createRoutePlansRouter(useCase: CreateRoutePlanUseCase, tokenService: TokenService, userRepository: UserRepository): Router { const router = Router(); router.post('/route-plans', createAuthenticationMiddleware(tokenService), createMustChangePasswordGuard(userRepository), new CreateRoutePlanController(useCase).handle); return router; }
