import type { User as PrismaUser } from './generated/client.js';

import { User } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { getPrismaClient } from './prisma-client-provider.js';

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const record = await getPrismaClient().user.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await getPrismaClient().user.findUnique({
      where: { email },
    });

    return record ? this.toDomain(record) : null;
  }

  async save(user: User): Promise<User> {
    const record = await getPrismaClient().user.create({
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordHash: user.passwordHash,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });

    return this.toDomain(record);
  }

  async update(user: User): Promise<User> {
    const record = await getPrismaClient().user.update({
      where: { id: user.id },
      data: {
        passwordHash: user.passwordHash,
        mustChangePassword: user.mustChangePassword,
      },
    });

    return this.toDomain(record);
  }

  private toDomain(record: PrismaUser): User {
    return User.create({
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      passwordHash: record.passwordHash,
      mustChangePassword: record.mustChangePassword,
      createdAt: record.createdAt,
    });
  }
}
