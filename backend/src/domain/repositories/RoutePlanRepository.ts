import type { RoutePlan } from '../entities/RoutePlan.js';
export interface RoutePlanRepository {
  save(routePlan: RoutePlan): Promise<RoutePlan>;
  findById(id: string): Promise<RoutePlan | null>;
}
