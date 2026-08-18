import type { WindForecast } from './WeatherService.js';
export type WindRiskLevel = 'normal' | 'caution' | 'high' | 'dangerous';
export function classifyWindRisk(forecast: Pick<WindForecast, 'windSpeedKmh' | 'windGustKmh'>): WindRiskLevel { const value = Math.max(forecast.windSpeedKmh, forecast.windGustKmh); if (value < 25) return 'normal'; if (value < 40) return 'caution'; if (value < 50) return 'high'; return 'dangerous'; }
export function windDirectionCardinal(degrees: number): string { return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((degrees % 360) + 360) % 360) / 45) % 8]; }
