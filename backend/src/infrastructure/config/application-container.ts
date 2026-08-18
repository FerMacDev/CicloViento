import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { PrismaUserRepository } from '../database/prisma-user-repository.js';
import { UnavailableEmailService } from '../email/unavailable-email-service.js';
import { CryptoIdGenerator } from '../security/crypto-id-generator.js';
import { SecurePasswordGenerator } from '../security/secure-password-generator.js';
import { ScryptPasswordHasher } from '../security/scrypt-password-hasher.js';

export function createRegisterUserUseCase(): RegisterUserUseCase {
  return new RegisterUserUseCase(
    new PrismaUserRepository(),
    new SecurePasswordGenerator(),
    new ScryptPasswordHasher(),
    new UnavailableEmailService(),
    new CryptoIdGenerator(),
  );
}
