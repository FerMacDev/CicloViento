import { randomUUID } from 'node:crypto';

import type { IdGenerator } from '../../application/services/IdGenerator.js';

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
