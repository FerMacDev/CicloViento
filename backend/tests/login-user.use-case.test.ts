import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { PasswordHasher } from '../src/application/services/PasswordHasher.js';
import type { TokenService } from '../src/application/services/TokenService.js';
import {
  InvalidCredentialsError,
  LoginUserUseCase,
} from '../src/application/use-cases/LoginUserUseCase.js';
import { User } from '../src/domain/entities/User.js';
import type { UserRepository } from '../src/domain/repositories/UserRepository.js';

const existingUser = User.create({
  id: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54',
  firstName: 'Usuario',
  lastName: 'Prueba',
  email: 'usuario@example.com',
  passwordHash: 'scrypt$test$hash',
  mustChangePassword: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

class FakeUserRepository implements UserRepository {
  constructor(private readonly user: User | null) {}

  async findByEmail(_email: string): Promise<User | null> {
    return this.user;
  }

  async findById(_id: string): Promise<User | null> {
    return this.user;
  }

  async save(user: User): Promise<User> {
    return user;
  }

  async update(user: User): Promise<User> {
    return user;
  }
}

class FakePasswordHasher implements PasswordHasher {
  received?: { password: string; hash: string };

  async hash(_plainPassword: string): Promise<string> {
    return 'unused';
  }

  async verify(password: string, hash: string): Promise<boolean> {
    this.received = { password, hash };
    return password === 'correct-password' && hash === existingUser.passwordHash;
  }
}

class FakeTokenService implements TokenService {
  receivedUserId?: string;

  createAccessToken(payload: { userId: string }): string {
    this.receivedUserId = payload.userId;
    return 'test-access-token';
  }

  verifyAccessToken(_token: string): { userId: string } {
    return { userId: existingUser.id };
  }
}

function createFixture(user: User | null = existingUser) {
  const passwordHasher = new FakePasswordHasher();
  const tokenService = new FakeTokenService();
  const useCase = new LoginUserUseCase(new FakeUserRepository(user), passwordHasher, tokenService);

  return { passwordHasher, tokenService, useCase };
}

test('LoginUserUseCase authenticates valid credentials and returns only safe user data', async () => {
  const fixture = createFixture();
  const result = await fixture.useCase.execute({ email: ' USUARIO@EXAMPLE.COM ', password: 'correct-password' });

  assert.equal(fixture.passwordHasher.received?.password, 'correct-password');
  assert.equal(fixture.passwordHasher.received?.hash, existingUser.passwordHash);
  assert.equal(fixture.tokenService.receivedUserId, existingUser.id);
  assert.equal(result.accessToken, 'test-access-token');
  assert.equal(result.user.mustChangePassword, true);
  assert.equal('passwordHash' in result.user, false);
  assert.equal('password' in result.user, false);
});

test('LoginUserUseCase rejects a nonexistent user with generic credentials error', async () => {
  const fixture = createFixture(null);

  await assert.rejects(
    () => fixture.useCase.execute({ email: 'missing@example.com', password: 'correct-password' }),
    InvalidCredentialsError,
  );
});

test('LoginUserUseCase rejects an incorrect password with the same generic error', async () => {
  const fixture = createFixture();

  await assert.rejects(
    () => fixture.useCase.execute({ email: 'usuario@example.com', password: 'incorrect-password' }),
    InvalidCredentialsError,
  );
});

test('Application does not depend on JWT, Prisma, Express, Supabase or Node crypto', async () => {
  const source = await readFile('src/application/use-cases/LoginUserUseCase.ts', 'utf8');
  const forbiddenDependencies = /jsonwebtoken|@prisma|prisma|supabase|express|node:crypto|scrypt/;

  assert.equal(forbiddenDependencies.test(source), false);
});
