export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface GeneratedRoute {
  start: RouteCoordinate;
  geometry: RouteCoordinate[];
  distanceM: number;
  durationS: number;
  ascentM?: number;
  descentM?: number;
}

export interface GenerateRoundTripInput {
  start: RouteCoordinate;
  targetDistanceKm: number;
}

export interface RoutingService {
  readonly maximumRoundTripDistanceKm: number;
  generateRoundTrip(input: GenerateRoundTripInput): Promise<GeneratedRoute>;
}

export class RouteNotFoundError extends Error {
  constructor() {
    super('No cycling route was found.');
    this.name = 'RouteNotFoundError';
  }
}

export class RoutingProviderUnavailableError extends Error {
  constructor() {
    super('Routing provider is temporarily unavailable.');
    this.name = 'RoutingProviderUnavailableError';
  }
}

export class RoutingRateLimitError extends Error {
  constructor() {
    super('Routing provider rate limit reached.');
    this.name = 'RoutingRateLimitError';
  }
}

export class RoutingProviderInvalidResponseError extends Error {
  constructor() {
    super('Routing provider returned an invalid response.');
    this.name = 'RoutingProviderInvalidResponseError';
  }
}
