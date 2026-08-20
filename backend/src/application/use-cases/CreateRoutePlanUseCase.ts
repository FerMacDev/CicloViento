import { RoutePlan, validateRoutePlanInput } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import type { IdGenerator } from '../services/IdGenerator.js';
import type { GeocodingService } from '../services/GeocodingService.js';

export interface CreateRoutePlanInput {
  userId: string;
  startLocation: string;
  date: string;
  startTime: string;
  distanceKm: number;
  elevationGainM: number;
  favorableWind: boolean;
}

export class RoutePlanLocationNotFoundError extends Error {
  constructor() {
    super('Start location could not be located.');
    this.name = 'RoutePlanLocationNotFoundError';
  }
}

export class CreateRoutePlanUseCase {
  constructor(
    private readonly repository: RoutePlanRepository,
    private readonly idGenerator: IdGenerator,
    private readonly geocoding: GeocodingService,
  ) {}

  async execute(input: CreateRoutePlanInput): Promise<RoutePlan> {
    validateRoutePlanInput(input);

    const coordinates = await this.geocoding.geocode(input.startLocation);
    if (!coordinates) throw new RoutePlanLocationNotFoundError();

    return this.repository.save(RoutePlan.create({
      ...input,
      ...coordinates,
      id: this.idGenerator.generate(),
      createdAt: new Date(),
    }));
  }
}
