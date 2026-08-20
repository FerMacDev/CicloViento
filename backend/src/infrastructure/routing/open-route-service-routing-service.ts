import {
  RouteNotFoundError,
  RoutingProviderInvalidResponseError,
  RoutingProviderUnavailableError,
  RoutingRateLimitError,
  type GenerateOutAndBackInput,
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
    return this.requestRoute({
      coordinates: [[input.start.longitude, input.start.latitude]],
      body: {
        elevation: true,
        options: {
          avoid_features: ['ferries', 'steps'],
          round_trip: {
            length: input.targetDistanceKm * 1000,
            points: 4,
            seed: input.seed ?? 1,
          },
        },
      },
      start: input.start,
    });
  }

  async generateOutAndBack(input: GenerateOutAndBackInput): Promise<GeneratedRoute> {
    const errors: unknown[] = [];

    for (const bearingDegrees of [0, 120, 240]) {
      const destination = destinationFrom(input.start, Math.max(1, input.targetDistanceKm / 2), bearingDegrees);
      try {
        const outbound = await this.requestRoute({
          coordinates: [[input.start.longitude, input.start.latitude], [destination.longitude, destination.latitude]],
          body: { elevation: true, options: { avoid_features: ['ferries', 'steps'] } },
          start: input.start,
        });
        const inbound = await this.requestRoute({
          coordinates: [[destination.longitude, destination.latitude], [input.start.longitude, input.start.latitude]],
          body: { elevation: true, options: { avoid_features: ['ferries', 'steps'] } },
          start: destination,
        });

        return {
          start: input.start,
          geometry: [...outbound.geometry, ...inbound.geometry.slice(1)],
          distanceM: outbound.distanceM + inbound.distanceM,
          durationS: outbound.durationS + inbound.durationS,
          ...(outbound.ascentM === undefined || inbound.ascentM === undefined ? {} : { ascentM: outbound.ascentM + inbound.ascentM }),
          ...(outbound.descentM === undefined || inbound.descentM === undefined ? {} : { descentM: outbound.descentM + inbound.descentM }),
        };
      } catch (error) {
        if (!(error instanceof RouteNotFoundError)) throw error;
        errors.push(error);
      }
    }

    throw errors[0] ?? new RouteNotFoundError();
  }

  private async requestRoute(input: {
    coordinates: [number, number][];
    body: Record<string, unknown>;
    start: RouteCoordinate;
  }): Promise<GeneratedRoute> {
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
        body: JSON.stringify({ coordinates: input.coordinates, ...input.body }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      throw new RoutingProviderUnavailableError();
    }

    if (response.status === 404) throw new RouteNotFoundError();
    if (response.status === 429) throw new RoutingRateLimitError();
    if (!response.ok && response.status >= 500) throw new RoutingProviderUnavailableError();
    if (!response.ok) throw new RoutingProviderInvalidResponseError();

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

function destinationFrom(start: RouteCoordinate, distanceKm: number, bearingDegrees: number): RouteCoordinate {
  const earthRadiusKm = 6371;
  const angularDistance = distanceKm / earthRadiusKm;
  const bearing = bearingDegrees * Math.PI / 180;
  const latitude = start.latitude * Math.PI / 180;
  const longitude = start.longitude * Math.PI / 180;
  const destinationLatitude = Math.asin(Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing));
  const destinationLongitude = longitude + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude), Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(destinationLatitude));

  return {
    latitude: destinationLatitude * 180 / Math.PI,
    longitude: ((destinationLongitude * 180 / Math.PI + 540) % 360) - 180,
  };
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
