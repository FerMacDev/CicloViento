import { RoutePlan } from '../../domain/entities/RoutePlan.js';
import type { RoutePlanRepository } from '../../domain/repositories/RoutePlanRepository.js';
import { getPrismaClient } from './prisma-client-provider.js';
export class PrismaRoutePlanRepository implements RoutePlanRepository {
  async save(plan: RoutePlan): Promise<RoutePlan> {
    await getPrismaClient().routePlan.create({
      data: {
        id: plan.id,
        userId: plan.userId,
        startLocation: plan.startLocation,
        date: new Date(`${plan.date}T00:00:00.000Z`),
        startTime: plan.startTime,
        distanceKm: plan.distanceKm,
        elevationGainM: plan.elevationGainM,
        favorableWind: plan.favorableWind,
        latitude: plan.latitude,
        longitude: plan.longitude,
        createdAt: plan.createdAt,
      },
    });
    return plan;
  }

  async findById(id: string): Promise<RoutePlan | null> {
    const record = await getPrismaClient().routePlan.findUnique({ where: { id } });
    if (!record || record.latitude === null || record.longitude === null) return null;

    return RoutePlan.create({
      id: record.id,
      userId: record.userId,
      startLocation: record.startLocation,
      date: record.date.toISOString().slice(0, 10),
      startTime: record.startTime,
      distanceKm: record.distanceKm,
      elevationGainM: record.elevationGainM,
      favorableWind: record.favorableWind,
      latitude: record.latitude,
      longitude: record.longitude,
      createdAt: record.createdAt,
    });
  }
}
