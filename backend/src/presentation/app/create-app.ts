import express, { type Express } from 'express';

import { createHealthRouter } from '../routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(createHealthRouter());

  return app;
}
