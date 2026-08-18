import type { User } from '../entities/User.js';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
