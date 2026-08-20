export interface RoutePlanProps {
  id: string;
  userId: string;
  startLocation: string;
  date: string;
  startTime: string;
  distanceKm: number;
  elevationGainM: number;
  favorableWind: boolean;
  latitude: number;
  longitude: number;
  createdAt: Date;
}

export type RoutePlanValidationField =
  | 'startLocation'
  | 'date'
  | 'startTime'
  | 'distanceKm'
  | 'elevationGainM'
  | 'coordinates';

export class RoutePlanValidationError extends Error {
  constructor(
    public readonly field: RoutePlanValidationField,
    message: string,
  ) {
    super(message);
    this.name = 'RoutePlanValidationError';
  }
}

type RoutePlanInput = Pick<
  RoutePlanProps,
  'startLocation' | 'date' | 'startTime' | 'distanceKm' | 'elevationGainM'
>;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function validateRoutePlanInput(input: RoutePlanInput): void {
  if (!input.startLocation?.trim()) {
    throw new RoutePlanValidationError('startLocation', 'Start location is required.');
  }
  if (!isValidDate(input.date)) {
    throw new RoutePlanValidationError('date', 'A valid route date is required.');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (new Date(`${input.date}T00:00:00.000Z`) < today) {
    throw new RoutePlanValidationError('date', 'Route date cannot be in the past.');
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime)) {
    throw new RoutePlanValidationError('startTime', 'A valid route start time is required.');
  }
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 10 || input.distanceKm > 300) {
    throw new RoutePlanValidationError('distanceKm', 'Distance must be between 10 and 300 km.');
  }
  if (!Number.isFinite(input.elevationGainM) || input.elevationGainM < 0 || input.elevationGainM > 5000) {
    throw new RoutePlanValidationError('elevationGainM', 'Elevation gain must be between 0 and 5000 m.');
  }
}

export class RoutePlan {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly startLocation: string,
    public readonly date: string,
    public readonly startTime: string,
    public readonly distanceKm: number,
    public readonly elevationGainM: number,
    public readonly favorableWind: boolean,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly createdAt: Date,
  ) {}

  static create(props: RoutePlanProps): RoutePlan {
    if (!props.id || !props.userId) {
      throw new RoutePlanValidationError('startLocation', 'Route plan identity is required.');
    }
    validateRoutePlanInput(props);
    if (
      !Number.isFinite(props.latitude)
      || props.latitude < -90
      || props.latitude > 90
      || !Number.isFinite(props.longitude)
      || props.longitude < -180
      || props.longitude > 180
    ) {
      throw new RoutePlanValidationError('coordinates', 'Valid coordinates are required.');
    }

    return new RoutePlan(
      props.id,
      props.userId,
      props.startLocation.trim(),
      props.date,
      props.startTime,
      props.distanceKm,
      props.elevationGainM,
      props.favorableWind,
      props.latitude,
      props.longitude,
      props.createdAt,
    );
  }
}
