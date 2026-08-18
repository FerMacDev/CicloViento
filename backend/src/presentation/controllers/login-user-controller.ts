import type { NextFunction, Request, Response } from 'express';

import {
  InvalidCredentialsError,
  LoginValidationError,
  type LoginUserInput,
  LoginUserUseCase,
} from '../../application/use-cases/LoginUserUseCase.js';
import { TokenServiceNotConfiguredError } from '../../application/services/TokenService.js';

export class LoginUserController {
  constructor(private readonly loginUserUseCase: LoginUserUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = request.body as LoginUserInput;
      const result = await this.loginUserUseCase.execute({ email, password });

      response.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        response.status(401).json({ message: error.message });
        return;
      }

      if (error instanceof LoginValidationError) {
        response.status(400).json({ message: error.message });
        return;
      }

      if (error instanceof TokenServiceNotConfiguredError) {
        response.status(503).json({ message: 'Authentication is not configured.' });
        return;
      }

      next(error);
    }
  };
}
