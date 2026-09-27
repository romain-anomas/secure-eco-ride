import { CalendarClock, Luggage, Plane, UserCheck } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import PageHero from '../components/PageHero.jsx';
import BookingForm from '../components/BookingForm.jsx';
import ContactStrip from '../components/ContactStrip.jsx';

const POINTS = [
  [CalendarClock, 'Scheduled transportation', 'Choose your pickup date and time and we plan the ride around your flight.'],
  [Plane, 'Arrivals and departures', 'Tell us the airport, direction and flight number so the driver is ready.'],
  [Luggage, 'Room for your bags', 'Share how many passengers and bags you have and we confirm a suitable vehicle.'],
  [UserCheck, 'Professional drivers', 'Courteous drivers who take you straight to where you need to be.'],
];

export default function AirportTransfers() {
  useSeo({ title: 'Airport Transfers | Secure Eco Ride', description: 'Reliable airport pickup and drop-off with professional drivers and scheduled transportation. Book your airport transfer with Secure Eco Ride.' });
  return (
    <>
      <PageHero title="Airport transfers" intro="Reliable airport pickup and drop-off services with professional drivers and scheduled transportation." />
      <section className="section bg-mist">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          <div>
            <h2 className="h-section">Arrive and depart without stress</h2>
            <div className="rule-green mt-4" />
            <ul className="mt-8 space-y-6">
              {POINTS.map(([Icon, title, text]) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-leaf text-moss"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <div><h3 className="font-display text-lg font-black uppercase tracking-tight">{title}</h3><p className="mt-1 text-night/70">{text}</p></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] border-t-4 border-leaf bg-white p-6 shadow-card sm:p-8" id="book">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight">Book airport transfer</h2>
            <div className="mt-5"><BookingForm mode="airport" defaultServiceSlug="airport-transfers" /></div>
          </div>
        </div>
      </section>
      <ContactStrip />
    </>
  );
}
