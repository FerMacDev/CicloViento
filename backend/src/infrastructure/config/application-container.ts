import type { TokenService } from '../../application/services/TokenService.js';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { PrismaUserRepository } from '../database/prisma-user-repository.js';
import { CryptoIdGenerator } from '../security/crypto-id-generator.js';
import { SecurePasswordGenerator } from '../security/secure-password-generator.js';
import { ScryptPasswordHasher } from '../security/scrypt-password-hasher.js';
import { createEmailService } from './email-service-factory.js';
import { createTokenService } from './token-service-factory.js';

export interface ApplicationDependencies {
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  tokenService: TokenService;
}

export function createRegisterUserUseCase(): RegisterUserUseCase {
  return new RegisterUserUseCase(
    new PrismaUserRepository(),
    new SecurePasswordGenerator(),
    new ScryptPasswordHasher(),
    createEmailService(),
    new CryptoIdGenerator(),
  );
}

export function createApplicationDependencies(): ApplicationDependencies {
  const userRepository = new PrismaUserRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = createTokenService();

  return {
    registerUserUseCase: new RegisterUserUseCase(
      userRepository,
      new SecurePasswordGenerator(),
      passwordHasher,
      createEmailService(),
      new CryptoIdGenerator(),
    ),
    loginUserUseCase: new LoginUserUseCase(userRepository, passwordHasher, tokenService),
    tokenService,
  };
}
