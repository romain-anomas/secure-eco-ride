import { ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import { useSettings } from '../context/SettingsContext.jsx';
import PageHero from '../components/PageHero.jsx';
import BookingForm from '../components/BookingForm.jsx';
import { prettyLocal } from '../utils/phone.js';

export default function Booking() {
  useSeo({ title: 'Book a Ride | Secure Eco Ride', description: 'Request a taxi ride, airport transfer or corporate trip with Secure Eco Ride. Our team confirms every booking.' });
  const { phones, tel } = useSettings();
  return (
    <>
      <PageHero title="Book a ride" intro="Fill in the details and our team will confirm your ride." />
      <section className="section bg-mist">
        <div className="container-x grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border-t-4 border-leaf bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight">Ride details</h2>
            <div className="mt-5"><BookingForm mode="full" /></div>
          </div>
          <aside className="space-y-5">
            <div className="rounded-3xl bg-night p-6 text-white">
              <h2 className="font-display text-xl font-black uppercase tracking-tight">Prefer to talk?</h2>
              <ul className="mt-4 space-y-3">
                {phones.map((p) => <li key={p}><a href={tel(p)} className="inline-flex items-center gap-3 font-display text-xl font-black hover:text-lime"><Phone className="h-5 w-5 text-lime" aria-hidden="true" />{prettyLocal(p)}</a></li>)}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">What happens next</h2>
              <ol className="mt-4 space-y-4 text-sm text-night/75">
                <li className="flex gap-3"><ClipboardCheck className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /> You get a booking ID straight away.</li>
                <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /> Our team confirms your ride by phone or WhatsApp.</li>
                <li className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-moss" aria-hidden="true" /> Your driver arrives at the agreed time.</li>
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
