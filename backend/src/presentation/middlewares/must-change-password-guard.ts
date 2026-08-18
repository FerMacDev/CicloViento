import type { NextFunction, Request, Response } from 'express';

import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { AuthenticatedRequest } from './authentication-middleware.js';

// This guard is applied only to future normal features; auth context and password change remain available.
export function createMustChangePasswordGuard(userRepository: UserRepository) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { userId } = (request as AuthenticatedRequest).authenticatedUser;
    const user = await userRepository.findById(userId);

    if (!user) {
      response.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    if (user.mustChangePassword) {
      response.status(403).json({ message: 'Password change required.' });
      return;
    }

    next();
  };
}
