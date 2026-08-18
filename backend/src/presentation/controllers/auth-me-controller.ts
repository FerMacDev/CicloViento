import type { Request, Response } from 'express';

import {
  AuthenticatedUserNotFoundError,
  GetAuthenticatedUserUseCase,
} from '../../application/use-cases/GetAuthenticatedUserUseCase.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

export class AuthMeController {
  constructor(private readonly getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase) {}

  handle = async (request: Request, response: Response): Promise<void> => {
    const authenticatedRequest = request as AuthenticatedRequest;
    try {
      const user = await this.getAuthenticatedUserUseCase.execute(authenticatedRequest.authenticatedUser.userId);
      response.status(200).json(user);
    } catch (error) {
      if (error instanceof AuthenticatedUserNotFoundError) {
        response.status(401).json({ message: 'Unauthorized.' });
        return;
      }

      throw error;
    }
  };
}
