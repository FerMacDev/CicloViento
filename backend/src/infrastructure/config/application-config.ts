export interface ApplicationConfig {
  port: number;
}

export function getApplicationConfig(): ApplicationConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
  };
}
