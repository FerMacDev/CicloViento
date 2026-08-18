import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/authentication-middleware.js';

export class AuthMeController {
  handle = (request: Request, response: Response): void => {
    const authenticatedRequest = request as AuthenticatedRequest;

    response.status(200).json({ userId: authenticatedRequest.authenticatedUser.userId });
  };
}
