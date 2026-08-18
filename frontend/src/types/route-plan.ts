export interface RoutePlanRequest { startLocation: string; date: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; }
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
}
