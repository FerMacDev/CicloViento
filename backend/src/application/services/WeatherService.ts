export interface WindForecast { dateTime: string; windSpeedKmh: number; windDirectionDegrees: number; windGustKmh: number; }
export interface WeatherService { getWindForecast(input: { latitude: number; longitude: number; date: string; referenceHour: number }): Promise<WindForecast>; }
export class WeatherForecastUnavailableError extends Error { constructor() { super('Weather forecast is not available for this date.'); this.name = 'WeatherForecastUnavailableError'; } }
export class WeatherProviderUnavailableError extends Error { constructor() { super('Weather provider is temporarily unavailable.'); this.name = 'WeatherProviderUnavailableError'; } }
export class WeatherProviderInvalidResponseError extends Error { constructor() { super('Weather provider returned an invalid response.'); this.name = 'WeatherProviderInvalidResponseError'; } }
