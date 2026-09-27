import { Link } from 'react-router-dom';
import ServiceIcon from './ServiceIcon.jsx';

export default function ServiceCard({ service, price }) {
  const to = service.is_bookable ? `/booking?service=${service.slug}` : '/booking';
  return (
    <article className="group flex h-full flex-col rounded-3xl border-2 border-transparent bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-leaf hover:shadow-glow">
      <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-leaf text-moss transition group-hover:bg-leaf group-hover:text-night">
        <ServiceIcon name={service.icon} />
      </span>
      <h3 className="mt-5 font-display text-xl font-black uppercase leading-tight tracking-tight text-moss">{service.name}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-night/70">{service.description}</p>
      {price && <p className="mt-3 text-sm font-semibold text-night/80">{price}</p>}
      <Link to={to} className="btn btn-outline btn-sm mt-6 self-start">Book now</Link>
    </article>
  );
}
