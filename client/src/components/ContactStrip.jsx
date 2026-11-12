import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';
import Leaf from './art/Leaf.jsx';

/** "BOOK YOUR RIDE TODAY!" band, echoing the bottom of the business card. */
export default function ContactStrip({ heading = 'Book your ride today!' }) {
  const { phones, primaryPhone, primaryWhatsApp, tel, wa } = useSettings();
  return (
    <section className="relative isolate overflow-hidden border-y border-emerald-900/10 bg-gradient-to-br from-emerald-50 via-white to-[#f4f7f5] py-16 text-night sm:py-20" aria-labelledby="book-today-title">
      <Leaf className="pointer-events-none absolute -left-4 bottom-4 -z-10 hidden w-20 -rotate-[24deg] text-emerald-700 opacity-15 sm:block" />
      <Leaf className="pointer-events-none absolute right-6 top-6 -z-10 hidden w-14 rotate-[30deg] text-emerald-700 opacity-15 sm:block" />
      <div className="container-x relative text-center">
        <h2 id="book-today-title" className="h-display">{heading}</h2>
        <div className="rule-green mx-auto mt-5" />
        <ul className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
          {phones.map((p) => (
            <li key={p}>
              <a href={tel(p)} className="inline-flex items-center gap-3 rounded-xl border border-emerald-800/20 bg-white px-6 py-3 font-display text-xl font-black tracking-wide text-night shadow-sm transition hover:border-emerald-700 hover:text-emerald-800 sm:text-2xl">
                <Phone className="h-5 w-5 text-emerald-700" aria-hidden="true" />{prettyLocal(p)}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {primaryPhone && <a href={tel(primaryPhone)} className="btn btn-primary"><Phone className="h-4 w-4" aria-hidden="true" /> Call now</a>}
          {primaryWhatsApp && <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride, I would like to book a ride.')} target="_blank" rel="noopener noreferrer" className="btn rounded-xl border border-night/15 bg-white text-night shadow-sm hover:border-emerald-700 hover:text-emerald-800"><MessageCircle className="h-4 w-4 text-emerald-700" aria-hidden="true" /> WhatsApp</a>}
          <Link to="/booking" className="btn rounded-xl border border-night/15 bg-white text-night shadow-sm hover:border-emerald-700 hover:text-emerald-800">Book a ride</Link>
        </div>
      </div>
    </section>
  );
}
