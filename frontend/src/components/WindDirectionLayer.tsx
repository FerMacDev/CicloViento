import { useMemo } from 'react';
import L from 'leaflet';
import { Marker } from 'react-leaflet';

import type { RouteCoordinate } from '../types/route-plan';
import { getWindRiskPresentation, getWindTravelDirection, selectWindArrowPoints, type WindRiskLevel } from './wind-direction';

interface WindDirectionLayerProps {
  geometry: RouteCoordinate[];
  windDirectionDegrees: number;
  riskLevel: WindRiskLevel;
  visible: boolean;
  arrowCount?: number;
}

function createWindArrowIcon(travelDirection: number, riskLevel: WindRiskLevel): L.DivIcon {
  const { color } = getWindRiskPresentation(riskLevel);
  return L.divIcon({
    className: 'wind-direction-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div class="wind-arrow-marker" aria-hidden="true"><svg class="wind-arrow-icon" viewBox="0 0 24 24" style="color: ${color}; transform: rotate(${travelDirection}deg)" focusable="false"><path d="M12 3 5.5 12h4.25v7h4.5v-7h4.25L12 3Z" /></svg></div>`,
  });
}

export function WindDirectionLayer({
  geometry,
  windDirectionDegrees,
  riskLevel,
  visible,
  arrowCount = 7,
}: WindDirectionLayerProps) {
  const points = useMemo(
    () => selectWindArrowPoints(geometry, arrowCount),
    [arrowCount, geometry],
  );
  const icon = useMemo(
    () => createWindArrowIcon(getWindTravelDirection(windDirectionDegrees), riskLevel),
    [riskLevel, windDirectionDegrees],
  );

  if (!visible) return null;

  return points.map((point, index) => (
    <Marker
      key={`${point.latitude}-${point.longitude}-${index}`}
      position={[point.latitude, point.longitude]}
      icon={icon}
      interactive={false}
      keyboard={false}
      zIndexOffset={400}
    />
  ));
}
