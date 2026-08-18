import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthenticatedUserNotFoundError,
  GetAuthenticatedUserUseCase,
} from '../src/application/use-cases/GetAuthenticatedUserUseCase.js';
import { User } from '../src/domain/entities/User.js';
import type { UserRepository } from '../src/domain/repositories/UserRepository.js';

const user = User.create({
  id: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54',
  firstName: 'Usuario',
  lastName: 'Prueba',
  email: 'usuario@example.com',
  passwordHash: 'scrypt$secret$hash',
  mustChangePassword: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

class FakeUserRepository implements UserRepository {
  constructor(private readonly result: User | null) {}

  async findById(_id: string): Promise<User | null> { return this.result; }
  async findByEmail(_email: string): Promise<User | null> { return this.result; }
  async save(value: User): Promise<User> { return value; }
  async update(value: User): Promise<User> { return value; }
}

test('GetAuthenticatedUserUseCase returns only public user information', async () => {
  const result = await new GetAuthenticatedUserUseCase(new FakeUserRepository(user)).execute(user.id);

  assert.deepEqual(result, {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mustChangePassword: true,
  });
  assert.equal('passwordHash' in result, false);
  assert.equal('password' in result, false);
});

test('GetAuthenticatedUserUseCase rejects a deleted authenticated user', async () => {
  await assert.rejects(
    () => new GetAuthenticatedUserUseCase(new FakeUserRepository(null)).execute(user.id),
    AuthenticatedUserNotFoundError,
  );
});
