import { User, UserValidationError } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { PasswordHasher } from '../services/PasswordHasher.js';
import type { TokenService } from '../services/TokenService.js';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResult {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mustChangePassword: boolean;
  };
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.');
    this.name = 'InvalidCredentialsError';
  }
}

export class LoginValidationError extends Error {
  constructor() {
    super('Email and password are required.');
    this.name = 'LoginValidationError';
  }
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserResult> {
    if (typeof input.email !== 'string' || typeof input.password !== 'string' || !input.password) {
      throw new LoginValidationError();
    }

    let email: string;
    try {
      email = User.normalizeEmail(input.email);
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw new LoginValidationError();
      }

      throw error;
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.passwordHasher.verify(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    return {
      accessToken: this.tokenService.createAccessToken({ userId: user.id }),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
