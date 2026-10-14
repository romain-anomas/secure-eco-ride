import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';
import Leaf from './art/Leaf.jsx';

/** "BOOK YOUR RIDE TODAY!" band, echoing the bottom of the business card. */
export default function ContactStrip({ heading = 'Book your ride today!' }) {
  const { phones, primaryPhone, primaryWhatsApp, tel, wa } = useSettings();
  return (
    <section className="relative overflow-hidden bg-night py-16 text-white sm:py-20" aria-labelledby="book-today-title">
      <Leaf className="pointer-events-none absolute -left-4 bottom-4 hidden w-20 -rotate-[24deg] opacity-60 sm:block" />
      <Leaf className="pointer-events-none absolute right-6 top-6 hidden w-14 rotate-[30deg] opacity-50 sm:block" />
      <div className="container-x relative text-center">
        <h2 id="book-today-title" className="h-display">{heading}</h2>
        <div className="rule-green mx-auto mt-5" />
        <ul className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          {phones.map((p) => (
            <li key={p}>
              <a href={tel(p)} className="inline-flex items-center gap-3 rounded-full border-2 border-leaf px-6 py-3 font-display text-xl font-black tracking-wide transition hover:bg-leaf hover:text-night sm:text-2xl">
                <Phone className="h-5 w-5" aria-hidden="true" />{prettyLocal(p)}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {primaryPhone && <a href={tel(primaryPhone)} className="btn btn-primary"><Phone className="h-4 w-4" aria-hidden="true" /> Call now</a>}
          {primaryWhatsApp && <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride, I would like to book a ride.')} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</a>}
          <Link to="/booking" className="btn btn-outline-light">Book a ride</Link>
        </div>
      </div>
    </section>
  );
}
