export interface AccessTokenPayload {
  userId: string;
}

export interface TokenService {
  createAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
}

export class TokenServiceNotConfiguredError extends Error {
  constructor() {
    super('Authentication token service is not configured.');
    this.name = 'TokenServiceNotConfiguredError';
  }
}

export class InvalidAccessTokenError extends Error {
  constructor() {
    super('Invalid authentication token.');
    this.name = 'InvalidAccessTokenError';
  }
}
