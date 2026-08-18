import type { NextFunction, Request, Response } from 'express';

import type { AccessTokenPayload, TokenService } from '../../application/services/TokenService.js';

export type AuthenticatedRequest = Request & {
  authenticatedUser: AccessTokenPayload;
};

export function createAuthenticationMiddleware(tokenService: TokenService) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const authorization = request.header('authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      response.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    try {
      (request as AuthenticatedRequest).authenticatedUser = tokenService.verifyAccessToken(match[1]);
      next();
    } catch {
      response.status(401).json({ message: 'Unauthorized.' });
    }
  };
}
