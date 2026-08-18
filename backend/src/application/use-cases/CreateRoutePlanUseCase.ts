import { RoutePlan } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import type { IdGenerator } from '../services/IdGenerator.js';
export interface CreateRoutePlanInput { userId: string; startLocation: string; date: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; }
export class CreateRoutePlanUseCase { constructor(private readonly repository: RoutePlanRepository, private readonly idGenerator: IdGenerator) {} async execute(input: CreateRoutePlanInput): Promise<RoutePlan> { return this.repository.save(RoutePlan.create({ ...input, id: this.idGenerator.generate(), createdAt: new Date() })); } }
