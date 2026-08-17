import { HealthCheck } from '../../domain/entities/HealthCheck.js';

export class CheckHealthUseCase {
  execute(): { status: 'ok' } {
    const healthCheck = HealthCheck.healthy();

    return { status: healthCheck.status };
  }
}
