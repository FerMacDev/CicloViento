import type { NextFunction, Request, Response } from 'express';

import { UserValidationError } from '../../domain/entities/User.js';
import {
  EmailAlreadyRegisteredError,
  EmailDeliveryNotConfiguredError,
  InitialCredentialsDeliveryError,
  type RegisterUserInput,
  RegisterUserUseCase,
} from '../../application/use-cases/RegisterUserUseCase.js';

export class RegisterUserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, email } = request.body as RegisterUserInput;
      const user = await this.registerUserUseCase.execute({ firstName, lastName, email });

      response.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        response.status(409).json({ message: error.message });
        return;
      }

      if (
        error instanceof EmailDeliveryNotConfiguredError ||
        error instanceof InitialCredentialsDeliveryError
      ) {
        response.status(503).json({ message: error.message });
        return;
      }

      if (error instanceof UserValidationError) {
        response.status(400).json({ message: error.message });
        return;
      }

      next(error);
    }
  };
}
