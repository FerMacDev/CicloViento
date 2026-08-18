import { User, UserValidationError } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { EmailService } from '../services/EmailService.js';
import type { IdGenerator } from '../services/IdGenerator.js';
import type { PasswordGenerator } from '../services/PasswordGenerator.js';
import type { PasswordHasher } from '../services/PasswordHasher.js';

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('The email is already registered.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class EmailDeliveryNotConfiguredError extends Error {
  constructor() {
    super('Email delivery is not configured.');
    this.name = 'EmailDeliveryNotConfiguredError';
  }
}

export class InitialCredentialsDeliveryError extends Error {
  constructor() {
    super('Initial credentials could not be delivered.');
    this.name = 'InitialCredentialsDeliveryError';
  }
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordGenerator: PasswordGenerator,
    private readonly passwordHasher: PasswordHasher,
    private readonly emailService: EmailService,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = User.normalizeEmail(input.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    if (!this.emailService.isAvailable()) {
      throw new EmailDeliveryNotConfiguredError();
    }

    const temporaryPassword = this.passwordGenerator.generate();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const user = User.create({
      id: this.idGenerator.generate(),
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
      mustChangePassword: true,
      createdAt: new Date(),
    });

    const savedUser = await this.userRepository.save(user);

    try {
      await this.emailService.sendInitialCredentials({
        recipientEmail: savedUser.email,
        recipientFirstName: savedUser.firstName,
        temporaryPassword,
      });
    } catch {
      throw new InitialCredentialsDeliveryError();
    }

    return savedUser;
  }
}

export { UserValidationError };
