export interface UserProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class User {
  private constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly mustChangePassword: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: UserProps): User {
    const firstName = User.requireText(props.firstName, 'First name');
    const lastName = User.requireText(props.lastName, 'Last name');
    const email = User.normalizeEmail(props.email);

    if (!props.id) {
      throw new UserValidationError('User id is required.');
    }

    if (!props.passwordHash) {
      throw new UserValidationError('Password hash is required.');
    }

    return new User(
      props.id,
      firstName,
      lastName,
      email,
      props.passwordHash,
      props.mustChangePassword,
      props.createdAt,
    );
  }

  static normalizeEmail(email: string): string {
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new UserValidationError('A valid email is required.');
    }

    return normalizedEmail;
  }

  private static requireText(value: string, field: string): string {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      throw new UserValidationError(`${field} is required.`);
    }

    return normalizedValue;
  }
}
