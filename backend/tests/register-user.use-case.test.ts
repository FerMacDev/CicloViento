import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import type { EmailService, InitialCredentialsEmail } from '../src/application/services/EmailService.js';
import type { IdGenerator } from '../src/application/services/IdGenerator.js';
import type { PasswordGenerator } from '../src/application/services/PasswordGenerator.js';
import type { PasswordHasher } from '../src/application/services/PasswordHasher.js';
import {
  EmailAlreadyRegisteredError,
  RegisterUserUseCase,
} from '../src/application/use-cases/RegisterUserUseCase.js';
import { User } from '../src/domain/entities/User.js';
import type { UserRepository } from '../src/domain/repositories/UserRepository.js';
import { RegisterUserController } from '../src/presentation/controllers/register-user-controller.js';
import { SecurePasswordGenerator } from '../src/infrastructure/security/secure-password-generator.js';

class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return this.users.get(email) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.email, user);
    return user;
  }
}

class FakePasswordGenerator implements PasswordGenerator {
  calls = 0;
  generatedPassword?: string;

  generate(): string {
    this.calls += 1;
    this.generatedPassword = `generated-at-${Date.now()}-${this.calls}`;
    return this.generatedPassword;
  }
}

class FakePasswordHasher implements PasswordHasher {
  receivedPassword?: string;

  async hash(plainPassword: string): Promise<string> {
    this.receivedPassword = plainPassword;
    return `hashed:${plainPassword}`;
  }
}

class FakeEmailService implements EmailService {
  sent?: InitialCredentialsEmail;

  isAvailable(): boolean {
    return true;
  }

  async sendInitialCredentials(email: InitialCredentialsEmail): Promise<void> {
    this.sent = email;
  }
}

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return 'b90ec0a1-ff7c-4662-a3aa-8c3d776fcd54';
  }
}

function createFixture() {
  const userRepository = new InMemoryUserRepository();
  const passwordGenerator = new FakePasswordGenerator();
  const passwordHasher = new FakePasswordHasher();
  const emailService = new FakeEmailService();
  const useCase = new RegisterUserUseCase(
    userRepository,
    passwordGenerator,
    passwordHasher,
    emailService,
    new FakeIdGenerator(),
  );

  return { userRepository, passwordGenerator, passwordHasher, emailService, useCase };
}

test('RegisterUserUseCase generates, hashes and delivers temporary credentials', async () => {
  const fixture = createFixture();

  const user = await fixture.useCase.execute({
    firstName: 'Usuario',
    lastName: 'Prueba',
    email: 'usuario@example.com',
  });

  assert.equal(fixture.passwordGenerator.calls, 1);
  assert.equal(fixture.passwordHasher.receivedPassword, fixture.passwordGenerator.generatedPassword);
  assert.equal(user.passwordHash, `hashed:${fixture.passwordGenerator.generatedPassword}`);
  assert.equal(user.mustChangePassword, true);
  assert.equal(fixture.userRepository.users.get(user.email), user);
  assert.deepEqual(fixture.emailService.sent, {
    recipientEmail: 'usuario@example.com',
    recipientFirstName: 'Usuario',
    temporaryPassword: fixture.passwordGenerator.generatedPassword,
  });
});

test('SecurePasswordGenerator produces a non-predictable password with all character types', () => {
  const password = new SecurePasswordGenerator().generate();

  assert.equal(password.length, 16);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%*\-_]/);
});

test('RegisterUserUseCase rejects duplicate emails without generating credentials', async () => {
  const fixture = createFixture();
  await fixture.useCase.execute({ firstName: 'Usuario', lastName: 'Prueba', email: 'usuario@example.com' });

  await assert.rejects(
    () => fixture.useCase.execute({ firstName: 'Otra', lastName: 'Persona', email: 'usuario@example.com' }),
    EmailAlreadyRegisteredError,
  );

  assert.equal(fixture.passwordGenerator.calls, 1);
});

test('RegisterUserController does not expose temporary credentials or password hashes', async () => {
  const fixture = createFixture();
  const controller = new RegisterUserController(fixture.useCase);
  let responseBody: Record<string, unknown> | undefined;
  let statusCode: number | undefined;
  const response = {
    status: (status: number) => {
      statusCode = status;
      return response;
    },
    json: (body: Record<string, unknown>) => {
      responseBody = body;
    },
  };

  await controller.handle(
    { body: { firstName: 'Usuario', lastName: 'Prueba', email: 'usuario@example.com', password: 'ignored' } } as never,
    response as never,
    () => {
      throw new Error('Unexpected controller error');
    },
  );

  assert.equal(statusCode, 201);
  assert.equal(responseBody?.email, 'usuario@example.com');
  assert.equal('passwordHash' in (responseBody ?? {}), false);
  assert.equal('password' in (responseBody ?? {}), false);
  assert.equal('temporaryPassword' in (responseBody ?? {}), false);
});

test('Domain and Application do not depend on infrastructure technologies', async () => {
  const [domainSource, applicationSource] = await Promise.all([
    readFile('src/domain/entities/User.ts', 'utf8'),
    readFile('src/application/use-cases/RegisterUserUseCase.ts', 'utf8'),
  ]);

  const forbiddenImports = /@prisma|prisma|@supabase|supabase|express|axios|fetch|node:crypto/;
  assert.equal(forbiddenImports.test(domainSource), false);
  assert.equal(forbiddenImports.test(applicationSource), false);
});
