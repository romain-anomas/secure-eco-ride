import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import PageHero from '../components/PageHero.jsx';
import FleetCard from '../components/FleetCard.jsx';
import ContactStrip from '../components/ContactStrip.jsx';

export default function Fleet() {
  useSeo({ title: 'Our Fleet | Secure Eco Ride', description: 'The vehicles available with Secure Eco Ride for city rides, airport transfers and corporate travel.' });
  const { data, loading, error } = useFetch('/fleet', { initial: [] });
  const [cat, setCat] = useState('All');
  const vehicles = data || [];
  const categories = useMemo(() => ['All', ...new Set(vehicles.map((v) => v.category))], [vehicles]);
  const shown = cat === 'All' ? vehicles : vehicles.filter((v) => v.category === cat);

  return (
    <>
      <PageHero title="Our fleet" intro="Sedans, SUVs and more — listed by our team as they join the fleet." />
      <section className="section bg-mist">
        <div className="container-x">
          {categories.length > 2 && (
            <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
              {categories.map((c) => (
                <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
                  className={`rounded-full border-2 px-4 py-2 font-display text-xs font-extrabold uppercase tracking-wide transition ${cat === c ? 'border-leaf bg-leaf text-night' : 'border-night/15 bg-white hover:border-leaf'}`}>{c}</button>
              ))}
            </div>
          )}
          {loading ? <p className="text-night/60">Loading fleet…</p> : shown.length ? (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{shown.map((v) => <li key={v.id}><FleetCard vehicle={v} /></li>)}</ul>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-leaf/50 bg-white p-10 text-center">
              <p className="font-display text-xl font-black uppercase">{error ? 'The fleet list could not be loaded' : 'Fleet details are being updated'}</p>
              <p className="mx-auto mt-2 max-w-lg text-night/70">Tell us your passengers and luggage when you book and we will confirm the right vehicle.</p>
              <Link to="/booking" className="btn btn-primary mt-6">Book a ride</Link>
            </div>
          )}
        </div>
      </section>
      <ContactStrip />
    </>
  );
}
