import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerUrl from 'leaflet/dist/images/marker-icon.png';
import markerRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [-1.9441, 30.0619];
const icon = new L.Icon({
  iconUrl: markerUrl,
  iconRetinaUrl: markerRetinaUrl,
  shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41],
});

function ClickPicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ point }) {
  const map = useMap();
  useEffect(() => { map.setView(point || DEFAULT_CENTER, point ? 15 : 12); }, [map, point?.[0], point?.[1]]);
  return null;
}

export default function BookingMap({ points, onChange }) {
  const [target, setTarget] = useState('pickup');
  const [message, setMessage] = useState('');
  const current = points[target];
  const center = current ? [current.latitude, current.longitude] : DEFAULT_CENTER;

  function locate() {
    setMessage('');
    if (!navigator.geolocation) { setMessage('Location is not available in this browser. You can select the map manually.'); return; }
    setMessage('Requesting your location…');
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      onChange(target, coords.latitude, coords.longitude);
      setMessage(coords.accuracy > 100 ? `Location accuracy is about ${Math.round(coords.accuracy)} m. Adjust the pin if needed.` : 'Location added. Drag the pin to adjust it.');
    }, (e) => setMessage(e.code === 1 ? 'Location permission was denied. Select your location on the map instead.' : 'Could not get your location. Select the map manually.'), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  return <section className="mt-5 rounded-2xl border border-night/10 p-4 sm:col-span-2" aria-label="Optional pickup and destination map">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-bold">Add map locations (optional)</h3><p className="text-xs text-night/55">Only share your current location if you choose to. Drag the pin or click the map.</p></div>
      <div className="flex gap-2">
        {['pickup', 'destination'].map((which) => <button key={which} type="button" onClick={() => setTarget(which)} className={`btn btn-sm ${target === which ? 'btn-primary' : 'btn-outline'}`}>{which === 'pickup' ? 'Pickup pin' : 'Destination pin'}</button>)}
      </div>
    </div>
    <button type="button" className="btn btn-outline btn-sm mt-3" onClick={locate}>Use My Current Location</button>
    {message && <p className="mt-2 text-sm text-night/70" role="status">{message}</p>}
    <div className="mt-3 h-64 overflow-hidden rounded-xl">
      <MapContainer center={center} zoom={current ? 15 : 12} className="h-full w-full" scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter point={center} />
        <ClickPicker onPick={(lat, lng) => onChange(target, lat, lng)} />
        {points.pickup && <Marker position={[points.pickup.latitude, points.pickup.longitude]} icon={icon} draggable eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange('pickup', p.lat, p.lng); } }} />}
        {points.destination && <Marker position={[points.destination.latitude, points.destination.longitude]} icon={icon} draggable eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange('destination', p.lat, p.lng); } }} />}
      </MapContainer>
    </div>
  </section>;
}
