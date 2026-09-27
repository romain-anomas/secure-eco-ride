import { Briefcase, Building2, CalendarDays, Crown, Hotel, Users } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import PageHero from '../components/PageHero.jsx';
import CorporateForm from '../components/CorporateForm.jsx';
import ContactStrip from '../components/ContactStrip.jsx';

const AUDIENCE = [
  [Briefcase, 'Businesses', 'Staff and client transport that runs to schedule.'],
  [Hotel, 'Hotels', 'Dependable rides for your guests, on request.'],
  [Building2, 'Organizations', 'Transport for teams, delegations and visitors.'],
  [CalendarDays, 'Events', 'Coordinated pickups for conferences and gatherings.'],
  [Crown, 'Executives', 'Professional, discreet, punctual.'],
  [Users, 'Private clients', 'Regular or one-off rides for individuals and families.'],
];

export default function Corporate() {
  useSeo({ title: 'Corporate & Private Travel | Secure Eco Ride', description: 'Reliable transport for businesses, hotels, organizations, events, executives and private clients.' });
  return (
    <>
      <PageHero title="Corporate & private travel" intro="Professional transport for businesses, hotels, organizations, events, executives and private clients." />
      <section className="section bg-mist">
        <div className="container-x">
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCE.map(([Icon, title, text]) => (
              <li key={title} className="rounded-3xl bg-white p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-leaf text-moss"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-4 font-display text-xl font-black uppercase tracking-tight">{title}</h3>
                <p className="mt-2 text-night/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section bg-white" id="request">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="h-section">Request corporate service</h2>
            <div className="rule-green mt-4" />
            <p className="mt-5 text-lg leading-relaxed text-night/70">Tell us what you need — regular routes, event transport or executive travel — and our team will contact you to agree the details and pricing.</p>
          </div>
          <div className="rounded-[2rem] border-t-4 border-leaf bg-mist p-6 sm:p-8"><CorporateForm /></div>
        </div>
      </section>
      <ContactStrip />
    </>
  );
}
