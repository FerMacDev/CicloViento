export interface GeocodingResult { latitude: number; longitude: number; displayName?: string; }
export interface GeocodingService { geocode(location: string): Promise<GeocodingResult | null>; }
export class GeocodingUnavailableError extends Error { constructor() { super('Geocoding service is temporarily unavailable.'); this.name = 'GeocodingUnavailableError'; } }
