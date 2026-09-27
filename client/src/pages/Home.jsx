import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Building2, CalendarDays, Hotel, Phone, Plane, ShieldCheck, Leaf, UserCheck, Users, Crown } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import useServices from '../hooks/useServices.js';
import { useSettings } from '../context/SettingsContext.jsx';
import HeroArt from '../components/art/HeroArt.jsx';
import BookingForm from '../components/BookingForm.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import FleetCard from '../components/FleetCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import WhyChoose from '../components/WhyChoose.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Testimonials from '../components/Testimonials.jsx';
import ContactStrip from '../components/ContactStrip.jsx';
import Reveal from '../components/Reveal.jsx';
import { prettyLocal } from '../utils/phone.js';

const BADGES = [[ShieldCheck, 'Safe & secure'], [Leaf, 'Eco friendly'], [UserCheck, 'Professional drivers']];
const AUDIENCE = [[Briefcase, 'Businesses'], [Hotel, 'Hotels'], [Building2, 'Organizations'], [CalendarDays, 'Events'], [Crown, 'Executives'], [Users, 'Private clients']];

function Hero() {
  const reduce = useReducedMotion();
  const { settings, primaryPhone, tel } = useSettings();
  const item = (i) => (reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: 'easeOut' } });

  return (
    <section className="relative overflow-hidden bg-night pb-32 pt-28 text-white sm:pb-40 sm:pt-32 lg:pt-36" aria-labelledby="hero-title">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-40 600C260 470 480 660 760 540S1200 380 1500 470" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".45" strokeWidth="2" />
        <path d="M-40 650C280 540 500 700 780 590S1220 450 1500 520" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".2" strokeWidth="1.5" />
      </svg>
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <motion.h1 id="hero-title" className="h-display text-[2.9rem] sm:text-6xl lg:text-7xl xl:text-[5.25rem]" {...item(0)}>
            <span className="block">Safe journeys.</span>
            <span className="block text-leaf">Cleaner tomorrow.</span>
          </motion.h1>
          <motion.p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl" {...item(1)}>{settings.tagline}</motion.p>
          <motion.div className="mt-8 flex flex-col gap-3 sm:flex-row" {...item(2)}>
            <Link to="/booking" className="btn btn-primary">Book a ride</Link>
            {primaryPhone && <a href={tel(primaryPhone)} className="btn btn-outline-light"><Phone className="h-4 w-4" aria-hidden="true" /> Call now <span className="font-sans font-semibold normal-case tracking-normal">{prettyLocal(primaryPhone)}</span></a>}
          </motion.div>
          <motion.ul className="mt-8 flex flex-wrap gap-2.5" {...item(3)}>
            {BADGES.map(([Icon, label]) => <li key={label} className="chip"><Icon className="h-4 w-4" aria-hidden="true" />{label}</li>)}
          </motion.ul>
        </div>

        <motion.div {...(reduce ? {} : { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.8, delay: 0.2 } })}>
          {settings.hero_image_url ? (
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-leaf/50">
              <img src={settings.hero_image_url} alt="" className="aspect-[4/3] w-full object-cover" fetchpriority="high" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent" />
            </div>
          ) : (
            <HeroArt />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function QuickBooking() {
  return (
    <section className="relative z-10 -mt-24 px-4 sm:-mt-28 sm:px-6 lg:px-8" aria-labelledby="quick-book-title">
      <div className="mx-auto max-w-6xl rounded-[2rem] border-t-4 border-leaf bg-white p-6 shadow-[0_30px_60px_-30px_rgba(11,15,16,.55)] sm:p-8">
        <h2 id="quick-book-title" className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">Book your ride</h2>
        <div className="mt-5"><BookingForm mode="quick" /></div>
      </div>
    </section>
  );
}

function Services() {
  const { services, priceFor } = useServices();
  return (
    <section className="section bg-mist" aria-labelledby="services-title">
      <div className="container-x">
        <SectionHeading title="Our services" intro="From a quick trip across town to a scheduled airport run, we plan every ride around your time." />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => <Reveal as="li" key={s.id} delay={i * 0.06}><ServiceCard service={s} price={priceFor(s)} /></Reveal>)}
        </ul>
      </div>
    </section>
  );
}

function FleetPreview() {
  const { data, loading } = useFetch('/fleet', { initial: [] });
  const vehicles = (data || []).slice(0, 3);
  return (
    <section className="section bg-white" aria-labelledby="fleet-title">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading title="Our fleet" intro="Vehicles are added by our team, so what you see here is what we run." />
          <Link to="/fleet" className="btn btn-outline btn-sm">See full fleet</Link>
        </div>
        {loading ? null : vehicles.length ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{vehicles.map((v) => <li key={v.id}><FleetCard vehicle={v} /></li>)}</ul>
        ) : (
          <div className="mt-10 rounded-3xl border-2 border-dashed border-leaf/50 bg-mist p-8 text-center">
            <p className="font-display text-xl font-black uppercase">Fleet details are being updated</p>
            <p className="mx-auto mt-2 max-w-lg text-night/70">Tell us how many passengers and how much luggage you have, and we will confirm the right vehicle when we confirm your booking.</p>
            <Link to="/booking" className="btn btn-primary mt-6">Book a ride</Link>
          </div>
        )}
      </div>
    </section>
  );
}

function AirportBand() {
  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-24" aria-labelledby="airport-title">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-night p-8 text-white sm:p-12 lg:p-14">
          <svg className="pointer-events-none absolute -right-10 top-0 h-full w-2/3 opacity-60" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 260C90 180 130 260 220 170S340 60 420 90" fill="none" stroke="rgb(var(--c-green))" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round" />
          </svg>
          <Plane className="absolute right-8 top-8 hidden h-24 w-24 -rotate-12 text-leaf/30 sm:block lg:h-36 lg:w-36" strokeWidth={1} aria-hidden="true" />
          <div className="relative max-w-2xl">
            <h2 id="airport-title" className="h-display text-4xl sm:text-5xl">Airport transfers</h2>
            <div className="rule-green mt-4" />
            <p className="mt-5 text-lg leading-relaxed text-white/75">Reliable airport pickup and drop-off services with professional drivers and scheduled transportation.</p>
            <ul className="mt-6 space-y-2 text-white/85">
              {['Scheduled pickups and drop-offs', 'Share your flight number and luggage when you book', 'Professional, courteous drivers'].map((t) => (
                <li key={t} className="flex items-start gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime" />{t}</li>
              ))}
            </ul>
            <Link to="/airport-transfers" className="btn btn-primary mt-8">Book airport transfer</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CorporateBand() {
  return (
    <section className="section bg-night text-white" aria-labelledby="corp-title">
      <div className="container-x grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 id="corp-title" className="h-display text-4xl sm:text-5xl">Corporate &amp; private travel</h2>
          <div className="rule-green mt-4" />
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">Dependable transport for the people and organisations that cannot afford a late car.</p>
          <Link to="/corporate" className="btn btn-primary mt-8">Request corporate service</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AUDIENCE.map(([Icon, label]) => (
            <li key={label} className="flex flex-col items-start gap-3 rounded-2xl border border-leaf/40 bg-coal p-4">
              <Icon className="h-6 w-6 text-lime" strokeWidth={1.75} aria-hidden="true" />
              <span className="font-display text-sm font-extrabold uppercase tracking-tight">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function AboutSnippet() {
  const { settings } = useSettings();
  const first = (settings.about_text || '').split('\n').find(Boolean) || settings.company_description;
  return (
    <section className="section bg-mist" aria-labelledby="about-title">
      <div className="container-x grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <SectionHeading title="About Secure Eco Ride" />
        <div>
          <p className="text-lg leading-relaxed text-night/75">{first}</p>
          <Link to="/about" className="btn btn-outline mt-6">More about us</Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useSeo({
    title: 'Secure Eco Ride | Safe & Reliable Taxi Services',
    description: 'Secure Eco Ride provides safe, reliable and professional taxi transportation, airport transfers, corporate travel and private rides.',
  });
  return (
    <>
      <Hero />
      <QuickBooking />
      <Services />
      <WhyChoose />
      <FleetPreview />
      <AirportBand />
      <HowItWorks />
      <CorporateBand />
      <Testimonials />
      <AboutSnippet />
      <ContactStrip />
    </>
  );
}
