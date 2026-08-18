import { RoutePlan } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import { getPrismaClient } from './prisma-client-provider.js';
export class PrismaRoutePlanRepository implements RoutePlanRepository { async save(plan: RoutePlan): Promise<RoutePlan> { await getPrismaClient().routePlan.create({ data: { id: plan.id, userId: plan.userId, startLocation: plan.startLocation, date: new Date(`${plan.date}T00:00:00.000Z`), distanceKm: plan.distanceKm, elevationGainM: plan.elevationGainM, favorableWind: plan.favorableWind, latitude: plan.latitude, longitude: plan.longitude, createdAt: plan.createdAt } }); return plan; } }
