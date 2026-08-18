export class InvalidNewPasswordError extends Error {
  constructor() {
    super('The new password must contain at least 12 characters, one letter and one number.');
    this.name = 'InvalidNewPasswordError';
  }
}

export interface PasswordPolicy {
  validate(password: string): void;
}

export class SimplePasswordPolicy implements PasswordPolicy {
  validate(password: string): void {
    if (
      typeof password !== 'string' ||
      password.length < 12 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      throw new InvalidNewPasswordError();
    }
  }
}
