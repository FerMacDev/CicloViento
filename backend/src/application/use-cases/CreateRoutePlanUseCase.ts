import { RoutePlan, RoutePlanValidationError } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import type { IdGenerator } from '../services/IdGenerator.js';
import type { GeocodingService } from '../services/GeocodingService.js';
export interface CreateRoutePlanInput { userId: string; startLocation: string; date: string; startTime: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; }
export class CreateRoutePlanUseCase { constructor(private readonly repository: RoutePlanRepository, private readonly idGenerator: IdGenerator, private readonly geocoding: GeocodingService) {} async execute(input: CreateRoutePlanInput): Promise<RoutePlan> { const coordinates=await this.geocoding.geocode(input.startLocation); if(!coordinates) throw new RoutePlanValidationError('Start location could not be located.'); return this.repository.save(RoutePlan.create({ ...input, ...coordinates, id: this.idGenerator.generate(), createdAt: new Date() })); } }
