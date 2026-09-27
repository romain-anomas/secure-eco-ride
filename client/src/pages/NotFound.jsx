import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';
import PageHero from '../components/PageHero.jsx';

export default function NotFound() {
  useSeo({ title: 'Page not found | Secure Eco Ride' });
  return (
    <>
      <PageHero title="Page not found" intro="This page does not exist or has moved." />
      <section className="section bg-white text-center">
        <div className="container-x"><Link to="/" className="btn btn-primary">Back to home</Link> <Link to="/booking" className="btn btn-outline ml-2">Book a ride</Link></div>
      </section>
    </>
  );
}
