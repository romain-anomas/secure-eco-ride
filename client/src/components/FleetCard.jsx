import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { STOCK_PHOTOS, photoUrl, photoSrcSet } from '../utils/images.js';

/** Illustrative stand-in photo for a category, used only until the admin uploads the real vehicle's photo. */
function placeholderFor(category = '') {
  return /suv|van|family|4x4|jeep/i.test(category) ? STOCK_PHOTOS.fleetSuv : STOCK_PHOTOS.fleetSedan;
}

export default function FleetCard({ vehicle }) {
  const features = Array.isArray(vehicle.features) ? vehicle.features : [];
  const hasPhoto = Boolean(vehicle.image_url);
  const stock = placeholderFor(vehicle.category);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className="relative aspect-[16/10] overflow-hidden bg-night">
        {hasPhoto ? (
          <img src={vehicle.image_url} alt={vehicle.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <>
            <img
              src={photoUrl(stock, { w: 800 })}
              srcSet={photoSrcSet(stock, [400, 640, 800, 1080])}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={`${vehicle.category} example`}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <span className="absolute bottom-3 right-3 rounded-full bg-night/80 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">Example photo</span>
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/40 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-leaf px-3 py-1 font-display text-xs font-extrabold uppercase tracking-wide text-night">{vehicle.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-xl font-black uppercase tracking-tight">{vehicle.name}</h3>
        {vehicle.model && <p className="text-sm text-night/60">{vehicle.model}</p>}
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-moss"><Users className="h-4 w-4" aria-hidden="true" /> Up to {vehicle.capacity} passengers</p>
        {vehicle.description && <p className="mt-3 text-sm leading-relaxed text-night/70">{vehicle.description}</p>}
        {features.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {features.map((f) => <li key={f} className="rounded-full border border-night/15 px-3 py-1 text-xs font-semibold text-night/75">{f}</li>)}
          </ul>
        )}
        <div className="mt-auto pt-6"><Link to="/booking" className="btn btn-primary btn-sm">Book this category</Link></div>
      </div>
    </article>
  );
}
