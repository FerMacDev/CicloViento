import type { TokenService } from '../../application/services/TokenService.js';
import { SimplePasswordPolicy } from '../../application/services/PasswordPolicy.js';
import { ChangePasswordUseCase } from '../../application/use-cases/ChangePasswordUseCase.js';
import { GetAuthenticatedUserUseCase } from '../../application/use-cases/GetAuthenticatedUserUseCase.js';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase.js';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase.js';
import { CreateRoutePlanUseCase } from '../../application/use-cases/CreateRoutePlanUseCase.js';
import { PrismaRoutePlanRepository } from '../database/prisma-route-plan-repository.js';
import { NominatimGeocodingService } from '../geocoding/nominatim-geocoding-service.js';
import { OpenRouteServiceRoutingService } from '../routing/open-route-service-routing-service.js';
import { GenerateCyclingRouteUseCase } from '../../application/use-cases/GenerateCyclingRouteUseCase.js';
import { GetRouteWeatherUseCase } from '../../application/use-cases/GetRouteWeatherUseCase.js';
import { OpenMeteoWeatherService } from '../weather/open-meteo-weather-service.js';
import { AnalyzePlannedRouteWindUseCase } from '../../application/use-cases/AnalyzePlannedRouteWindUseCase.js';
import { PrismaUserRepository } from '../database/prisma-user-repository.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import { CryptoIdGenerator } from '../security/crypto-id-generator.js';
import { SecurePasswordGenerator } from '../security/secure-password-generator.js';
import { ScryptPasswordHasher } from '../security/scrypt-password-hasher.js';
import { createEmailService } from './email-service-factory.js';
import { createTokenService } from './token-service-factory.js';

export interface ApplicationDependencies {
  registerUserUseCase: RegisterUserUseCase;
  loginUserUseCase: LoginUserUseCase;
  changePasswordUseCase: ChangePasswordUseCase;
  getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase;
  tokenService: TokenService;
  userRepository: UserRepository;
  createRoutePlanUseCase: CreateRoutePlanUseCase;
  generateCyclingRouteUseCase: GenerateCyclingRouteUseCase;
  getRouteWeatherUseCase: GetRouteWeatherUseCase;
  analyzePlannedRouteWindUseCase: AnalyzePlannedRouteWindUseCase;
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

  const routePlanRepository = new PrismaRoutePlanRepository();

  return {
    registerUserUseCase: new RegisterUserUseCase(
      userRepository,
      new SecurePasswordGenerator(),
      passwordHasher,
      createEmailService(),
      new CryptoIdGenerator(),
    ),
    loginUserUseCase: new LoginUserUseCase(userRepository, passwordHasher, tokenService),
    changePasswordUseCase: new ChangePasswordUseCase(
      userRepository,
      passwordHasher,
      new SimplePasswordPolicy(),
    ),
    getAuthenticatedUserUseCase: new GetAuthenticatedUserUseCase(userRepository),
    tokenService,
    userRepository,
    createRoutePlanUseCase: new CreateRoutePlanUseCase(routePlanRepository, new CryptoIdGenerator(), new NominatimGeocodingService(process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org', process.env.NOMINATIM_USER_AGENT ?? 'CicloViento/1.0')),
    generateCyclingRouteUseCase: new GenerateCyclingRouteUseCase(
      routePlanRepository,
      new OpenRouteServiceRoutingService(process.env.ORS_API_KEY),
    ),
    getRouteWeatherUseCase: new GetRouteWeatherUseCase(routePlanRepository, new OpenMeteoWeatherService()),
    analyzePlannedRouteWindUseCase: new AnalyzePlannedRouteWindUseCase(routePlanRepository,new OpenRouteServiceRoutingService(process.env.ORS_API_KEY),new OpenMeteoWeatherService()),
  };
}
