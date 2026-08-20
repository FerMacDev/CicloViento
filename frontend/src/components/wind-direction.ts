import type { RouteCoordinate } from '../types/route-plan';

export type WindRiskLevel = 'normal' | 'caution' | 'high' | 'dangerous';

export interface WindRiskPresentation {
  color: string;
  label: string;
}

const WIND_RISK_PRESENTATIONS: Record<WindRiskLevel, WindRiskPresentation> = {
  normal: { color: '#2f855a', label: 'Normal' },
  caution: { color: '#b7791f', label: 'Precaución' },
  high: { color: '#c05621', label: 'Alto' },
  dangerous: { color: '#c53030', label: 'Peligroso' },
};

const UNKNOWN_WIND_RISK: WindRiskPresentation = {
  color: '#64748b',
  label: 'Sin clasificación',
};

export function getWindRiskPresentation(riskLevel: string | undefined): WindRiskPresentation {
  return riskLevel && riskLevel in WIND_RISK_PRESENTATIONS
    ? WIND_RISK_PRESENTATIONS[riskLevel as WindRiskLevel]
    : UNKNOWN_WIND_RISK;
}

export function getWindTravelDirection(meteorologicalDirection: number): number {
  return ((meteorologicalDirection % 360) + 540) % 360;
}

export function selectWindArrowPoints(
  geometry: RouteCoordinate[],
  arrowCount = 7,
): RouteCoordinate[] {
  if (geometry.length < 3 || arrowCount < 1) return [];

  const count = Math.min(arrowCount, geometry.length - 2);
  const selected: RouteCoordinate[] = [];
  const indexes = new Set<number>();

  for (let index = 1; index <= count; index += 1) {
    const geometryIndex = Math.round((index / (count + 1)) * (geometry.length - 1));
    if (!indexes.has(geometryIndex)) {
      indexes.add(geometryIndex);
      selected.push(geometry[geometryIndex]);
    }
  }

  return selected;
}
