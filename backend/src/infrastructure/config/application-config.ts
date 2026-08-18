import 'dotenv/config';

export interface ApplicationConfig {
  port: number;
  corsOrigin: string;
}

export function getApplicationConfig(): ApplicationConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  };
}
