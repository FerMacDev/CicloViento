import type { UserRepository } from '../../domain/repositories/UserRepository.js';

export interface AuthenticatedUserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mustChangePassword: boolean;
}

export class AuthenticatedUserNotFoundError extends Error {
  constructor() {
    super('Authenticated user not found.');
    this.name = 'AuthenticatedUserNotFoundError';
  }
}

export class GetAuthenticatedUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<AuthenticatedUserResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthenticatedUserNotFoundError();
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
