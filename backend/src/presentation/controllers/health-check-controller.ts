import type { Request, Response } from 'express';

import { CheckHealthUseCase } from '../../application/use-cases/CheckHealthUseCase.js';

export class HealthCheckController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  handle = (_request: Request, response: Response): void => {
    const result = this.checkHealthUseCase.execute();

    response.status(200).json(result);
  };
}
