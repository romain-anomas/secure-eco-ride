import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import SectionHeading from './SectionHeading.jsx';

export default function Testimonials() {
  const { data, loading, error } = useFetch('/testimonials', { initial: [] });
  const items = data || [];

  return (
    <section className="section bg-white" aria-labelledby="testimonials-title">
      <div className="container-x">
        <SectionHeading title="What our customers say" as="h2" />
        {loading ? null : items.length > 0 ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <li key={t.id} className="rounded-3xl border border-night/10 bg-mist p-6">
                <div className="mb-5 flex flex-col items-center text-center">
                  <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-leaf/15 font-display text-2xl font-extrabold text-moss" aria-hidden="true">
                    {t.customer_name?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  {t.customer_photo_url && <img src={t.customer_photo_url} alt={`${t.customer_name}`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="-mt-20 h-20 w-20 rounded-full object-cover" />}
                  <p className="mt-3 font-display font-extrabold tracking-tight">{t.customer_name}</p>
                </div>
                <p className="flex justify-center gap-0.5 text-leaf" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-5 w-5 ${i < t.rating ? 'fill-leaf' : 'text-night/20'}`} aria-hidden="true" />)}
                </p>
                <blockquote className="mt-4 text-center leading-relaxed text-night/80">“{t.text}”</blockquote>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-3xl border-2 border-dashed border-leaf/50 bg-mist p-8 text-center sm:p-10">
            <h3 className="font-display text-xl font-black uppercase">{error ? 'Reviews are unavailable right now' : 'Customer reviews are coming soon'}</h3>
            <p className="mx-auto mt-2 max-w-lg text-night/70">We only publish real feedback from real riders. Take a trip with us and tell us how it went.</p>
            <Link to="/booking" className="btn btn-primary mt-6">Book a ride</Link>
          </div>
        )}
      </div>
    </section>
  );
}
