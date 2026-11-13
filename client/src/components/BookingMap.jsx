import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [-1.9441, 30.0619];
const icon = new L.Icon({ iconUrl: markerUrl, iconRetinaUrl: markerRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

function PickupPicker({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function Recenter({ point }) {
  const map = useMap();
  useEffect(() => {
    map.setView(point || DEFAULT_CENTER, point ? 16 : 12);
  }, [map, point?.[0], point?.[1]]);
  return null;
}

export default function BookingMap({ point, onChange, onLocate, locationStatus, error }) {
  const center = point ? [point.latitude, point.longitude] : DEFAULT_CENTER;
  const statusText = {
    detecting: 'Detecting your current location…',
    detected: 'Pickup pin detected. You can drag it or tap the map to adjust it.',
    denied: 'Location permission was denied. Tap the map to set your pickup pin.',
    unavailable: 'Could not detect your location. Tap the map to set your pickup pin.',
    manual: 'Tap the map to set your pickup pin.',
  }[locationStatus];

  return <section id="bf-pickup_pin" tabIndex={-1} className="rounded-2xl border border-night/10 p-4 focus:outline-none sm:col-span-2" aria-labelledby="pickup-map-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 id="pickup-map-title" className="font-bold">Choose pickup on map <span className="text-red-600" aria-hidden="true">*</span></h3>
        <p className="mt-1 text-xs text-night/60">Your pickup pin will be sent to the admin and assigned driver. Drag the pin or tap the map to adjust it.</p>
        <p className="mt-2 text-sm text-night/75" role="status" aria-live="polite">{statusText}</p>
        {point && <p className="mt-1 text-xs text-night/55">Pin: {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}</p>}
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      </div>
      <button type="button" className="btn btn-outline btn-sm" onClick={onLocate} disabled={locationStatus === 'detecting'}>
        {locationStatus === 'detecting' ? 'Detecting…' : 'Detect my location'}
      </button>
    </div>
    <div className="mt-3 h-64 overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={point ? 16 : 12} className="h-full w-full" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter point={center} />
        <PickupPicker onPick={onChange} />
        {point && <Marker position={[point.latitude, point.longitude]} icon={icon} draggable eventHandlers={{ dragend: (event) => {
          const position = event.target.getLatLng();
          onChange(position.lat, position.lng);
        } }} />}
      </MapContainer>
    </div>
  </section>;
}
