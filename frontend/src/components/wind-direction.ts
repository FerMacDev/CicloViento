import type { RouteCoordinate } from '../types/route-plan';

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
