import assert from 'node:assert/strict';
import test from 'node:test';

import { User } from '../src/domain/entities/User.js';
import type { UserRepository } from '../src/domain/repositories/UserRepository.js';
import { createMustChangePasswordGuard } from '../src/presentation/middlewares/must-change-password-guard.js';

function createUser(mustChangePassword: boolean): User {
  return User.create({
    id: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54',
    firstName: 'Usuario',
    lastName: 'Prueba',
    email: 'usuario@example.com',
    passwordHash: 'hashed:CurrentPassword2026',
    mustChangePassword,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

class FakeUserRepository implements UserRepository {
  constructor(private readonly user: User | null) {}

  async findById(_id: string): Promise<User | null> { return this.user; }
  async findByEmail(_email: string): Promise<User | null> { return this.user; }
  async save(user: User): Promise<User> { return user; }
  async update(user: User): Promise<User> { return user; }
}

function createResponse() {
  let statusCode: number | undefined;
  let body: Record<string, unknown> | undefined;
  const response = {
    status: (status: number) => {
      statusCode = status;
      return response;
    },
    json: (value: Record<string, unknown>) => { body = value; },
  };

  return { response, get statusCode() { return statusCode; }, get body() { return body; } };
}

test('must-change-password guard blocks normal features until the password is changed', async () => {
  const guard = createMustChangePasswordGuard(new FakeUserRepository(createUser(true)));
  const response = createResponse();

  await guard({ authenticatedUser: { userId: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54' } } as never, response.response as never, () => {
    throw new Error('Unexpected next call');
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { message: 'Password change required.' });
});

test('must-change-password guard allows a user after the password is changed', async () => {
  const guard = createMustChangePasswordGuard(new FakeUserRepository(createUser(false)));
  const response = createResponse();
  let nextCalled = false;

  await guard({ authenticatedUser: { userId: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54' } } as never, response.response as never, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, undefined);
});
