import type { NextFunction, Request, Response } from 'express';

import {
  ChangePasswordUseCase,
  ChangePasswordUserNotFoundError,
  ChangePasswordValidationError,
  IncorrectCurrentPasswordError,
  NewPasswordMatchesCurrentError,
} from '../../application/use-cases/ChangePasswordUseCase.js';
import { InvalidNewPasswordError } from '../../application/services/PasswordPolicy.js';
import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordController {
  constructor(private readonly changePasswordUseCase: ChangePasswordUseCase) {}

  handle = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = request.body as ChangePasswordBody;
      const { userId } = (request as AuthenticatedRequest).authenticatedUser;
      await this.changePasswordUseCase.execute({ userId, currentPassword, newPassword });

      response.status(200).json({ message: 'Password changed successfully.' });
    } catch (error) {
      if (error instanceof ChangePasswordUserNotFoundError) {
        response.status(404).json({ message: error.message });
        return;
      }

      if (error instanceof IncorrectCurrentPasswordError) {
        response.status(400).json({ message: error.message });
        return;
      }

      if (
        error instanceof ChangePasswordValidationError ||
        error instanceof InvalidNewPasswordError ||
        error instanceof NewPasswordMatchesCurrentError
      ) {
        response.status(400).json({ message: error.message });
        return;
      }

      next(error);
    }
  };
}
