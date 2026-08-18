import assert from 'node:assert/strict';
import test from 'node:test';

import type { PasswordHasher } from '../src/application/services/PasswordHasher.js';
import { SimplePasswordPolicy } from '../src/application/services/PasswordPolicy.js';
import {
  ChangePasswordUseCase,
  ChangePasswordUserNotFoundError,
  IncorrectCurrentPasswordError,
  NewPasswordMatchesCurrentError,
} from '../src/application/use-cases/ChangePasswordUseCase.js';
import { InvalidNewPasswordError } from '../src/application/services/PasswordPolicy.js';
import { User } from '../src/domain/entities/User.js';
import type { UserRepository } from '../src/domain/repositories/UserRepository.js';

const user = User.create({
  id: 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54',
  firstName: 'Usuario',
  lastName: 'Prueba',
  email: 'usuario@example.com',
  passwordHash: 'hashed:CurrentPassword2026',
  mustChangePassword: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

class FakeUserRepository implements UserRepository {
  updatedUser?: User;

  constructor(private readonly existingUser: User | null = user) {}

  async findById(_id: string): Promise<User | null> {
    return this.existingUser;
  }

  async findByEmail(_email: string): Promise<User | null> {
    return this.existingUser;
  }

  async save(value: User): Promise<User> {
    return value;
  }

  async update(value: User): Promise<User> {
    this.updatedUser = value;
    return value;
  }
}

class FakePasswordHasher implements PasswordHasher {
  verifyCalls: Array<{ password: string; hash: string }> = [];
  hashedPassword?: string;

  async hash(password: string): Promise<string> {
    this.hashedPassword = password;
    return `hashed:${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    this.verifyCalls.push({ password, hash });
    return password === 'CurrentPassword2026' && hash === user.passwordHash;
  }
}

function createFixture(existingUser: User | null = user) {
  const userRepository = new FakeUserRepository(existingUser);
  const passwordHasher = new FakePasswordHasher();
  const useCase = new ChangePasswordUseCase(userRepository, passwordHasher, new SimplePasswordPolicy());

  return { userRepository, passwordHasher, useCase };
}

test('ChangePasswordUseCase replaces the hash and clears mustChangePassword', async () => {
  const fixture = createFixture();

  const result = await fixture.useCase.execute({
    userId: user.id,
    currentPassword: 'CurrentPassword2026',
    newPassword: 'NewPassword2026',
  });

  assert.equal(result, undefined);
  assert.equal(fixture.passwordHasher.verifyCalls[0].password, 'CurrentPassword2026');
  assert.equal(fixture.passwordHasher.hashedPassword, 'NewPassword2026');
  assert.equal(fixture.userRepository.updatedUser?.passwordHash, 'hashed:NewPassword2026');
  assert.equal(fixture.userRepository.updatedUser?.mustChangePassword, false);
});

test('ChangePasswordUseCase rejects an unknown user without persisting changes', async () => {
  const fixture = createFixture(null);

  await assert.rejects(
    () => fixture.useCase.execute({ userId: user.id, currentPassword: 'CurrentPassword2026', newPassword: 'NewPassword2026' }),
    ChangePasswordUserNotFoundError,
  );
  assert.equal(fixture.userRepository.updatedUser, undefined);
});

test('ChangePasswordUseCase rejects an incorrect current password without persisting changes', async () => {
  const fixture = createFixture();

  await assert.rejects(
    () => fixture.useCase.execute({ userId: user.id, currentPassword: 'wrong-password', newPassword: 'NewPassword2026' }),
    IncorrectCurrentPasswordError,
  );
  assert.equal(fixture.userRepository.updatedUser, undefined);
});

test('ChangePasswordUseCase rejects a new password that does not meet the policy', async () => {
  const fixture = createFixture();

  await assert.rejects(
    () => fixture.useCase.execute({ userId: user.id, currentPassword: 'CurrentPassword2026', newPassword: 'short1' }),
    InvalidNewPasswordError,
  );
  assert.equal(fixture.userRepository.updatedUser, undefined);
});

test('ChangePasswordUseCase rejects a new password equal to the current password', async () => {
  const fixture = createFixture();

  await assert.rejects(
    () => fixture.useCase.execute({ userId: user.id, currentPassword: 'CurrentPassword2026', newPassword: 'CurrentPassword2026' }),
    NewPasswordMatchesCurrentError,
  );
  assert.equal(fixture.userRepository.updatedUser, undefined);
});
