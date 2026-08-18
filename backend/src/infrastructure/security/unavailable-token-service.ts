import {
  TokenServiceNotConfiguredError,
  type AccessTokenPayload,
  type TokenService,
} from '../../application/services/TokenService.js';

export class UnavailableTokenService implements TokenService {
  createAccessToken(_payload: AccessTokenPayload): string {
    throw new TokenServiceNotConfiguredError();
  }

  verifyAccessToken(_token: string): AccessTokenPayload {
    throw new TokenServiceNotConfiguredError();
  }
}
