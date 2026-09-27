import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';
import useServices from '../hooks/useServices.js';
import PageHero from '../components/PageHero.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import ContactStrip from '../components/ContactStrip.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Services() {
  useSeo({ title: 'Taxi Services | Secure Eco Ride', description: 'Local and long distance rides, airport transfers, corporate and private travel with Secure Eco Ride.' });
  const { services, priceFor } = useServices();
  const { settings } = useSettings();
  return (
    <>
      <PageHero title="Our services" intro="Safe, reliable rides for every kind of journey." />
      <section className="section bg-mist">
        <div className="container-x">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => <li key={s.id}><ServiceCard service={s} price={priceFor(s)} /></li>)}
          </ul>
          {settings.service_areas && (
            <div className="mt-12 rounded-3xl bg-white p-6 shadow-card sm:p-8">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight">Where we operate</h2>
              <p className="mt-3 whitespace-pre-line text-night/75">{settings.service_areas}</p>
            </div>
          )}
          {!settings.show_prices && (
            <p className="mt-8 text-center text-night/65">Prices depend on distance, time and vehicle. <Link to="/booking" className="font-bold text-moss underline">Request a ride</Link> and we will confirm the fare with you.</p>
          )}
        </div>
      </section>
      <ContactStrip />
    </>
  );
}
