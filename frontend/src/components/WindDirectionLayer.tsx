import { useMemo } from 'react';
import L from 'leaflet';
import { Marker } from 'react-leaflet';

import type { RouteCoordinate } from '../types/route-plan';
import { getWindTravelDirection, selectWindArrowPoints } from './wind-direction';

interface WindDirectionLayerProps {
  geometry: RouteCoordinate[];
  windDirectionDegrees: number;
  visible: boolean;
  arrowCount?: number;
}

function createWindArrowIcon(travelDirection: number): L.DivIcon {
  return L.divIcon({
    className: 'wind-direction-div-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div class="wind-arrow-marker" aria-hidden="true"><svg class="wind-arrow-icon" viewBox="0 0 24 24" style="transform: rotate(${travelDirection}deg)" focusable="false"><path d="M12 3 5.5 12h4.25v7h4.5v-7h4.25L12 3Z" /></svg></div>`,
  });
}

export function WindDirectionLayer({
  geometry,
  windDirectionDegrees,
  visible,
  arrowCount = 7,
}: WindDirectionLayerProps) {
  const points = useMemo(
    () => selectWindArrowPoints(geometry, arrowCount),
    [arrowCount, geometry],
  );
  const icon = useMemo(
    () => createWindArrowIcon(getWindTravelDirection(windDirectionDegrees)),
    [windDirectionDegrees],
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
