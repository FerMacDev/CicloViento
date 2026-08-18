export interface RoutePlanRequest { startLocation: string; date: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; }
export interface RoutePlanResponse extends RoutePlanRequest { id: string; createdAt: string; }
