import {
  RouteNotFoundError,
  RoutingProviderInvalidResponseError,
  RoutingProviderUnavailableError,
  RoutingRateLimitError,
  type GenerateRoundTripInput,
  type GeneratedRoute,
  type RouteCoordinate,
  type RoutingService,
} from '../../application/services/RoutingService.js';

interface OrsGeoJsonResponse {
  features?: Array<{
    geometry?: { type?: string; coordinates?: unknown };
    properties?: {
      summary?: { distance?: unknown; duration?: unknown };
      ascent?: unknown;
      descent?: unknown;
    };
  }>;
}

interface OrsGeoJsonGeometry {
  type?: string;
  coordinates?: unknown;
}

export class OpenRouteServiceRoutingService implements RoutingService {
  readonly maximumRoundTripDistanceKm = 100;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl = 'https://api.openrouteservice.org',
  ) {}

  async generateRoundTrip(input: GenerateRoundTripInput): Promise<GeneratedRoute> {
    if (!this.apiKey) throw new RoutingProviderUnavailableError();

    let response: Response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      response = await fetch(`${this.baseUrl}/v2/directions/cycling-road/geojson`, {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/geo+json, application/json',
        },
        body: JSON.stringify({
          coordinates: [[input.start.longitude, input.start.latitude]],
          elevation: true,
          options: {
            avoid_features: ['ferries', 'steps'],
            round_trip: {
              length: input.targetDistanceKm * 1000,
              points: 4,
              seed: input.seed ?? 1,
            },
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      throw new RoutingProviderUnavailableError();
    }

    if (response.status === 404) throw new RouteNotFoundError();
    if (response.status === 429) throw new RoutingRateLimitError();
    if (!response.ok && response.status >= 500) throw new RoutingProviderUnavailableError();
    if (!response.ok) throw new RouteNotFoundError();

    let payload: OrsGeoJsonResponse;
    try {
      payload = await response.json() as OrsGeoJsonResponse;
    } catch {
      throw new RoutingProviderInvalidResponseError();
    }

    const feature = payload.features?.[0];
    const summary = feature?.properties?.summary;
    const geometry = this.toRouteCoordinates(feature?.geometry);
    if (!summary || !isPositiveNumber(summary.distance) || !isPositiveNumber(summary.duration) || geometry.length < 2) {
      throw new RoutingProviderInvalidResponseError();
    }

    return {
      start: input.start,
      geometry,
      distanceM: summary.distance,
      durationS: summary.duration,
      ...(isNonNegativeNumber(feature.properties?.ascent) ? { ascentM: feature.properties?.ascent } : {}),
      ...(isNonNegativeNumber(feature.properties?.descent) ? { descentM: feature.properties?.descent } : {}),
    };
  }

  private toRouteCoordinates(geometry: OrsGeoJsonGeometry | undefined): RouteCoordinate[] {
    if (geometry?.type !== 'LineString' || !Array.isArray(geometry.coordinates)) return [];

    return geometry.coordinates.flatMap((coordinate): RouteCoordinate[] => {
      if (!Array.isArray(coordinate) || !isFiniteNumber(coordinate[0]) || !isFiniteNumber(coordinate[1])) return [];
      return [{ latitude: coordinate[1], longitude: coordinate[0] }];
    });
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}
