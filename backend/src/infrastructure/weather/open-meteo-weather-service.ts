import {
  WeatherForecastUnavailableError,
  WeatherProviderInvalidResponseError,
  WeatherProviderUnavailableError,
  type WeatherService,
  type WindForecast,
} from '../../application/services/WeatherService.js';

interface Payload {
  hourly?: {
    time?: unknown;
    wind_speed_10m?: unknown;
    wind_direction_10m?: unknown;
    wind_gusts_10m?: unknown;
    weather_code?: unknown;
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    precipitation_probability?: unknown;
  };
}

interface ForecastTarget { date: string; time: string; }

export class OpenMeteoWeatherService implements WeatherService {
  constructor(private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast') {}

  async getWindForecast(input: { latitude: number; longitude: number; date: string; startTime: string }): Promise<WindForecast> {
    const target = nearestForecastTarget(input.date, input.startTime);
    const params = new URLSearchParams({
      latitude: String(input.latitude), longitude: String(input.longitude),
      hourly: 'weather_code,temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
      wind_speed_unit: 'kmh', timezone: 'auto', start_date: input.date, end_date: target.date,
    });
    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      response = await fetch(`${this.baseUrl}?${params}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      clearTimeout(timeout);
    } catch { throw new WeatherProviderUnavailableError(); }
    if (!response.ok) {
      if (response.status === 400) throw new WeatherForecastUnavailableError();
      throw new WeatherProviderUnavailableError();
    }
    let data: Payload;
    try { data = await response.json() as Payload; } catch { throw new WeatherProviderInvalidResponseError(); }
    const hourly = data.hourly;
    if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.wind_speed_10m) || !Array.isArray(hourly.wind_direction_10m) || !Array.isArray(hourly.wind_gusts_10m) || !Array.isArray(hourly.weather_code) || !Array.isArray(hourly.temperature_2m) || !Array.isArray(hourly.apparent_temperature) || !Array.isArray(hourly.precipitation_probability)) throw new WeatherProviderInvalidResponseError();
    const dateTime = `${target.date}T${target.time}`;
    const index = hourly.time.indexOf(dateTime);
    if (index < 0) throw new WeatherForecastUnavailableError();
    const values = [hourly.wind_speed_10m[index], hourly.wind_direction_10m[index], hourly.wind_gusts_10m[index], hourly.weather_code[index], hourly.temperature_2m[index], hourly.apparent_temperature[index], hourly.precipitation_probability[index]];
    if (!values.every((value) => typeof value === 'number' && Number.isFinite(value))) throw new WeatherProviderInvalidResponseError();
    const [windSpeedKmh, windDirectionDegrees, windGustKmh, weatherCode, temperatureC, apparentTemperatureC, precipitationProbabilityPercent] = values as number[];
    return { dateTime, windSpeedKmh, windDirectionDegrees, windGustKmh, weatherCode, temperatureC, apparentTemperatureC, precipitationProbabilityPercent };
  }
}

// Open-Meteo provides hourly values. Minutes before :30 use the current hour; :30 and later use the next one.
export function nearestForecastTarget(date: string, startTime: string): ForecastTarget {
  const [hourText, minuteText] = startTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const useNextHour = minute >= 30;
  const dateAtMidnight = new Date(`${date}T00:00:00.000Z`);
  dateAtMidnight.setUTCDate(dateAtMidnight.getUTCDate() + (useNextHour && hour === 23 ? 1 : 0));
  return { date: dateAtMidnight.toISOString().slice(0, 10), time: `${String(useNextHour ? (hour + 1) % 24 : hour).padStart(2, '0')}:00` };
}
