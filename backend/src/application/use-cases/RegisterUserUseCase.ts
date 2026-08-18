import { User, UserValidationError } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { IdGenerator } from '../services/IdGenerator.js';
import type { PasswordHasher } from '../services/PasswordHasher.js';

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('The email is already registered.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidRegistrationDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRegistrationDataError';
  }
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    if (!input.password) {
      throw new InvalidRegistrationDataError('Password is required.');
    }

    const email = User.normalizeEmail(input.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = User.create({
      id: this.idGenerator.generate(),
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    return this.userRepository.save(user);
  }
}

export { UserValidationError };
