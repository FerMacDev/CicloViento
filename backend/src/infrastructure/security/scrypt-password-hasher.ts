import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasher } from '../../application/services/PasswordHasher.js';

const scrypt = promisify(scryptCallback);

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(plainPassword, salt, 64)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    const [algorithm, salt, expectedKey] = passwordHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !expectedKey) {
      return false;
    }

    const expectedKeyBuffer = Buffer.from(expectedKey, 'hex');
    if (expectedKeyBuffer.length === 0 || expectedKeyBuffer.toString('hex') !== expectedKey) {
      return false;
    }

    const derivedKey = (await scrypt(plainPassword, salt, expectedKeyBuffer.length)) as Buffer;
    return timingSafeEqual(derivedKey, expectedKeyBuffer);
  }
}
