import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { PasswordHasher } from '../services/PasswordHasher.js';
import type { PasswordPolicy } from '../services/PasswordPolicy.js';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordValidationError extends Error {
  constructor() {
    super('Current password and new password are required.');
    this.name = 'ChangePasswordValidationError';
  }
}

export class ChangePasswordUserNotFoundError extends Error {
  constructor() {
    super('User not found.');
    this.name = 'ChangePasswordUserNotFoundError';
  }
}

export class IncorrectCurrentPasswordError extends Error {
  constructor() {
    super('Current password is incorrect.');
    this.name = 'IncorrectCurrentPasswordError';
  }
}

export class NewPasswordMatchesCurrentError extends Error {
  constructor() {
    super('The new password must be different from the current password.');
    this.name = 'NewPasswordMatchesCurrentError';
  }
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly passwordPolicy: PasswordPolicy,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    if (
      typeof input.userId !== 'string' ||
      typeof input.currentPassword !== 'string' ||
      typeof input.newPassword !== 'string' ||
      !input.currentPassword ||
      !input.newPassword
    ) {
      throw new ChangePasswordValidationError();
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new ChangePasswordUserNotFoundError();
    }

    if (!(await this.passwordHasher.verify(input.currentPassword, user.passwordHash))) {
      throw new IncorrectCurrentPasswordError();
    }

    this.passwordPolicy.validate(input.newPassword);

    if (await this.passwordHasher.verify(input.newPassword, user.passwordHash)) {
      throw new NewPasswordMatchesCurrentError();
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepository.update(user.withPasswordHash(passwordHash, false));
  }
}
