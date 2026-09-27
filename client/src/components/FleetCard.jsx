import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import CarSilhouette from './art/CarSilhouette.jsx';

export default function FleetCard({ vehicle }) {
  const features = Array.isArray(vehicle.features) ? vehicle.features : [];
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="relative aspect-[16/10] bg-night">
        {vehicle.image_url ? (
          <img src={vehicle.image_url} alt={vehicle.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-coal to-night p-8">
            <CarSilhouette className="w-4/5" />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-leaf px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-night">{vehicle.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-black uppercase tracking-tight">{vehicle.name}</h3>
        {vehicle.model && <p className="text-sm text-night/60">{vehicle.model}</p>}
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-moss"><Users className="h-4 w-4" aria-hidden="true" /> Up to {vehicle.capacity} passengers</p>
        {vehicle.description && <p className="mt-3 text-sm leading-relaxed text-night/70">{vehicle.description}</p>}
        {features.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {features.map((f) => <li key={f} className="rounded-full border border-night/15 px-3 py-1 text-xs font-semibold text-night/75">{f}</li>)}
          </ul>
        )}
        <Link to="/booking" className="btn btn-primary btn-sm mt-6 self-start">Book this category</Link>
      </div>
    </article>
  );
}
