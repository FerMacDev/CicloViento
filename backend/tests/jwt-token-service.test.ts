import assert from 'node:assert/strict';
import test from 'node:test';

import jwt from 'jsonwebtoken';

import { InvalidAccessTokenError } from '../src/application/services/TokenService.js';
import { JwtTokenService } from '../src/infrastructure/security/jwt-token-service.js';

const testSecret = 'test-jwt-secret-that-is-never-used-outside-this-test';

test('JwtTokenService creates and verifies an access token with only the expected identity claim', () => {
  const tokenService = new JwtTokenService(testSecret, '15m');
  const token = tokenService.createAccessToken({ userId: 'user-123' });
  const decoded = jwt.decode(token) as jwt.JwtPayload;

  assert.equal(tokenService.verifyAccessToken(token).userId, 'user-123');
  assert.equal(decoded.sub, 'user-123');
  assert.equal('password' in decoded, false);
  assert.equal('passwordHash' in decoded, false);
  assert.equal('mustChangePassword' in decoded, false);
});

test('JwtTokenService rejects tokens with an invalid signature', () => {
  const token = new JwtTokenService(testSecret).createAccessToken({ userId: 'user-123' });

  assert.throws(() => new JwtTokenService('another-test-secret').verifyAccessToken(token), InvalidAccessTokenError);
});

test('JwtTokenService rejects expired tokens', () => {
  const token = new JwtTokenService(testSecret, -1).createAccessToken({ userId: 'user-123' });

  assert.throws(() => new JwtTokenService(testSecret).verifyAccessToken(token), InvalidAccessTokenError);
});
