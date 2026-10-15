import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const icon = new L.Icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

function FitPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    else if (points[0]) map.setView(points[0], 15);
  }, [map, points]);
  return null;
}

export default function BookingLocationMap({ booking }) {
  const points = [
    booking.pickup_latitude != null && booking.pickup_longitude != null ? { position: [Number(booking.pickup_latitude), Number(booking.pickup_longitude)], label: 'Passenger pickup' } : null,
    booking.destination_latitude != null && booking.destination_longitude != null ? { position: [Number(booking.destination_latitude), Number(booking.destination_longitude)], label: 'Trip destination' } : null,
  ].filter(Boolean);
  if (!points.length) return <p className="text-sm text-night/60">No map coordinates were provided for this booking.</p>;
  const center = points[0].position;
  return <div className="h-64 overflow-hidden rounded-xl">
    <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitPoints points={points.map((point) => point.position)} />
      {points.map((point) => <Marker key={point.label} position={point.position} icon={icon}><Popup>{point.label}</Popup></Marker>)}
    </MapContainer>
  </div>;
}
