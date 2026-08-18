import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasher } from '../../application/services/PasswordHasher.js';

const scrypt = promisify(scryptCallback);

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(plainPassword, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }
}
