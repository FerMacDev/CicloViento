import { randomInt } from 'node:crypto';

import type { PasswordGenerator } from '../../application/services/PasswordGenerator.js';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*-_';
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

export class SecurePasswordGenerator implements PasswordGenerator {
  generate(): string {
    const characters = [
      this.pick(UPPERCASE),
      this.pick(LOWERCASE),
      this.pick(DIGITS),
      this.pick(SYMBOLS),
    ];

    while (characters.length < 16) {
      characters.push(this.pick(ALL_CHARACTERS));
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const replacementIndex = randomInt(index + 1);
      [characters[index], characters[replacementIndex]] = [characters[replacementIndex], characters[index]];
    }

    return characters.join('');
  }

  private pick(characters: string): string {
    return characters[randomInt(characters.length)];
  }
}
