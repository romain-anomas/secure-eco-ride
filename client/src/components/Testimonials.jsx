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
                <p className="flex gap-0.5 text-leaf" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-5 w-5 ${i < t.rating ? 'fill-leaf' : 'text-night/20'}`} aria-hidden="true" />)}
                </p>
                <blockquote className="mt-4 leading-relaxed text-night/80">“{t.text}”</blockquote>
                <p className="mt-4 font-display font-extrabold uppercase tracking-tight">{t.customer_name}</p>
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
