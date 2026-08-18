import jwt, { type SignOptions } from 'jsonwebtoken';

import {
  InvalidAccessTokenError,
  type AccessTokenPayload,
  type TokenService,
} from '../../application/services/TokenService.js';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: SignOptions['expiresIn'] = '15m',
  ) {}

  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign({}, this.secret, {
      subject: payload.userId,
      expiresIn: this.expiresIn,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, this.secret);
      if (typeof payload === 'string' || typeof payload.sub !== 'string' || !payload.sub) {
        throw new InvalidAccessTokenError();
      }

      return { userId: payload.sub };
    } catch {
      throw new InvalidAccessTokenError();
    }
  }
}
