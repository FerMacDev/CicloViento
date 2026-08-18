import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

import type { TokenService } from '../../application/services/TokenService.js';
import { JwtTokenService } from '../security/jwt-token-service.js';
import { UnavailableTokenService } from '../security/unavailable-token-service.js';

export function createTokenService(): TokenService {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return new UnavailableTokenService();
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
  return new JwtTokenService(secret, expiresIn);
}
