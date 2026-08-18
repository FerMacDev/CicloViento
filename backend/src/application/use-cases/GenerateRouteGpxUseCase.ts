import type { GpxGenerator } from '../services/GpxGenerator.js';
import { createGpxFilename } from '../services/GpxGenerator.js';
import type { GenerateCyclingRouteUseCase } from './GenerateCyclingRouteUseCase.js';

export class GenerateRouteGpxUseCase {
  constructor(
    private readonly generateCyclingRouteUseCase: GenerateCyclingRouteUseCase,
    private readonly gpxGenerator: GpxGenerator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(routePlanId: string, authenticatedUserId: string): Promise<{ content: string; filename: string }> {
    const generated = await this.generateCyclingRouteUseCase.execute(routePlanId, authenticatedUserId);
    const name = `CicloViento - ${generated.routePlan.startLocation} - ${generated.routePlan.date}`;

    return {
      content: this.gpxGenerator.generate({ route: generated.route, name, createdAt: this.now() }),
      filename: createGpxFilename(generated.routePlan.startLocation, generated.routePlan.date),
    };
  }
}
