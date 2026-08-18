import assert from 'node:assert/strict';
import test from 'node:test';

import type { TokenService } from '../src/application/services/TokenService.js';
import { createAuthenticationMiddleware } from '../src/presentation/middlewares/authentication-middleware.js';

class FakeTokenService implements TokenService {
  createAccessToken(_payload: { userId: string }): string {
    return 'unused';
  }

  verifyAccessToken(token: string): { userId: string } {
    if (token !== 'valid-token') {
      throw new Error('Invalid token');
    }

    return { userId: 'user-123' };
  }
}

function createResponse() {
  let statusCode: number | undefined;
  let body: Record<string, unknown> | undefined;
  const response = {
    status: (status: number) => {
      statusCode = status;
      return response;
    },
    json: (value: Record<string, unknown>) => {
      body = value;
    },
  };

  return { response, get statusCode() { return statusCode; }, get body() { return body; } };
}

test('authentication middleware accepts a valid Bearer token and sets the request context', () => {
  const middleware = createAuthenticationMiddleware(new FakeTokenService());
  const request = { header: () => 'Bearer valid-token' };
  const response = createResponse();
  let nextCalled = false;

  middleware(request as never, response.response as never, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal((request as { authenticatedUser?: { userId: string } }).authenticatedUser?.userId, 'user-123');
  assert.equal(response.statusCode, undefined);
});

test('authentication middleware rejects missing and invalid Bearer tokens with the same 401 response', () => {
  const middleware = createAuthenticationMiddleware(new FakeTokenService());

  for (const authorization of [undefined, 'Basic credentials', 'Bearer invalid-token']) {
    const response = createResponse();
    middleware({ header: () => authorization } as never, response.response as never, () => {
      throw new Error('Unexpected next call');
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Unauthorized.' });
  }
});
