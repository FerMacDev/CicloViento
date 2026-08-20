export interface RoutePlanProps { id: string; userId: string; startLocation: string; date: string; startTime: string; distanceKm: number; elevationGainM: number; favorableWind: boolean; latitude: number; longitude: number; createdAt: Date; }
export class RoutePlanValidationError extends Error { constructor(message: string) { super(message); this.name = 'RoutePlanValidationError'; } }
export class RoutePlan {
  private constructor(public readonly id: string, public readonly userId: string, public readonly startLocation: string, public readonly date: string, public readonly startTime: string, public readonly distanceKm: number, public readonly elevationGainM: number, public readonly favorableWind: boolean, public readonly latitude: number, public readonly longitude: number, public readonly createdAt: Date) {}
  static create(props: RoutePlanProps): RoutePlan {
    const startLocation = props.startLocation?.trim();
    if (!props.id || !props.userId || !startLocation) throw new RoutePlanValidationError('Start location is required.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.date) || Number.isNaN(Date.parse(`${props.date}T00:00:00.000Z`))) throw new RoutePlanValidationError('A valid route date is required.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(props.startTime)) throw new RoutePlanValidationError('A valid route start time is required.');
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    if (new Date(`${props.date}T00:00:00.000Z`) < today) throw new RoutePlanValidationError('Route date cannot be in the past.');
    if (!Number.isFinite(props.distanceKm) || props.distanceKm < 10 || props.distanceKm > 300) throw new RoutePlanValidationError('Distance must be between 10 and 300 km.');
    if (!Number.isFinite(props.elevationGainM) || props.elevationGainM < 0 || props.elevationGainM > 5000) throw new RoutePlanValidationError('Elevation gain must be between 0 and 5000 m.');
    if (!Number.isFinite(props.latitude) || props.latitude < -90 || props.latitude > 90 || !Number.isFinite(props.longitude) || props.longitude < -180 || props.longitude > 180) throw new RoutePlanValidationError('Valid coordinates are required.');
    return new RoutePlan(props.id, props.userId, startLocation, props.date, props.startTime, props.distanceKm, props.elevationGainM, props.favorableWind, props.latitude, props.longitude, props.createdAt);
  }
}
