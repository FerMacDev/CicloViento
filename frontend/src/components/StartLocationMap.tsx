import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { RouteCoordinate } from '../types/route-plan';
import { WindDirectionLayer } from './WindDirectionLayer';
const icon=L.icon({iconUrl:markerIcon,shadowUrl:markerShadow,iconSize:[25,41],iconAnchor:[12,41]});
function FitRoute({ coordinates }: { coordinates: RouteCoordinate[] }) {
  const map = useMap();
  useEffect(() => { if (coordinates.length > 1) map.fitBounds(coordinates.map(({ latitude, longitude }) => [latitude, longitude]), { padding: [24, 24] }); }, [coordinates, map]);
  return null;
}
export function StartLocationMap({latitude,longitude,startLocation,geometry=[],windDirectionDegrees,showWind=false}:{latitude:number;longitude:number;startLocation:string;geometry?:RouteCoordinate[];windDirectionDegrees?:number;showWind?:boolean}) {
  const positions = geometry.map(({ latitude: pointLatitude, longitude: pointLongitude }) => [pointLatitude, pointLongitude] as [number, number]);
  return <div className="route-map"><MapContainer center={[latitude,longitude]} zoom={12} style={{height:'320px'}}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[latitude,longitude]} icon={icon}><Popup>Punto de partida: {startLocation}</Popup></Marker>{positions.length > 1 && <><Polyline positions={positions} pathOptions={{ color: '#176b87', weight: 5 }} /><FitRoute coordinates={geometry}/>{windDirectionDegrees !== undefined && <WindDirectionLayer geometry={geometry} windDirectionDegrees={windDirectionDegrees} visible={showWind}/>}</>}</MapContainer></div>;
}
