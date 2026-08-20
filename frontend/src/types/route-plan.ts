export interface RoutePlanRequest { startLocation: string; date: string; startTime: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; }
export interface RoutePlanResponse extends RoutePlanRequest { id: string; latitude: number; longitude: number; createdAt: string; }
export interface RouteCoordinate { latitude: number; longitude: number; }
export interface GeneratedRouteResponse {
  routePlanId: string;
  requestedDistanceKm: number;
  requestedElevationGainM: number;
  favorableWindRequested: boolean;
  actualDistanceKm: number;
  durationSeconds: number;
  ascentM?: number;
  descentM?: number;
  start: RouteCoordinate;
  geometry: RouteCoordinate[];
  optimization?: WindOptimizedRouteResponse;
}
export interface RouteWeatherResponse { routePlanId: string; forecastDateTime: string; windSpeedKmh: number; windDirectionDegrees: number; windGustKmh: number; weatherCode: number; temperatureC: number; apparentTemperatureC: number; precipitationProbabilityPercent: number; windDirectionCardinal: string; riskLevel: 'normal' | 'caution' | 'high' | 'dangerous'; }
export interface WindAnalysisResponse { routePlanId:string; wind:{speedKmh:number;gustKmh:number;directionDegrees:number;directionCardinal:string;riskLevel:'normal'|'caution'|'high'|'dangerous'}; analysis:{tailwindPercent:number;headwindPercent:number;crosswindPercent:number;returnTailwindPercent:number;returnHeadwindPercent:number;returnCrosswindPercent:number;averageLongitudinalComponentKmh:number;averageCrosswindComponentKmh:number;maxCrosswindComponentKmh:number;favorableWindScore:number}; }

export interface RouteCandidateSummary {
  seed: number;
  actualDistanceKm: number;
  ascentM?: number;
  favorableWindScore?: number;
  returnTailwindPercent?: number;
  returnHeadwindPercent?: number;
  returnCrosswindPercent?: number;
  withinDistanceTolerance: boolean;
  selected: boolean;
}

export type RouteSelectionMode = 'wind-optimized' | 'distance-fallback' | 'weather-unavailable';

export interface WindOptimizedRouteResponse {
  candidateCount: number;
  selectedCandidate?: number;
  selectionMode: RouteSelectionMode;
  wind?: WindAnalysisResponse['wind'];
  analysis?: WindAnalysisResponse['analysis'];
  candidates: RouteCandidateSummary[];
}
