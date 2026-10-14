import { Link } from 'react-router-dom';
import { Briefcase, Building2, CalendarDays, Hotel, Phone, ShieldCheck, Leaf, UserCheck, Users, Crown, Zap } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import useServices from '../hooks/useServices.js';
import { useSettings } from '../context/SettingsContext.jsx';
import BookingForm from '../components/BookingForm.jsx';
import TrackRideButton from '../components/TrackRideButton.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import FleetCard from '../components/FleetCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import WhyChoose from '../components/WhyChoose.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Testimonials from '../components/Testimonials.jsx';
import ContactStrip from '../components/ContactStrip.jsx';
import Reveal from '../components/Reveal.jsx';
import { prettyLocal } from '../utils/phone.js';
import { smartImageProps, photoUrl, photoSrcSet, STOCK_PHOTOS } from '../utils/images.js';

const AUDIENCE = [[Briefcase, 'Businesses'], [Hotel, 'Hotels'], [Building2, 'Organizations'], [CalendarDays, 'Events'], [Crown, 'Executives'], [Users, 'Private clients']];

function Hero() {
  const { settings } = useSettings();
  const photo = settings.hero_image_url ? smartImageProps(settings.hero_image_url, { w: 2000 }) : { src: '/helo.png' };

  return (
    <section className="relative isolate h-[470px] overflow-hidden bg-mist sm:h-[520px] lg:h-auto lg:aspect-[1672/941]" aria-label="Secure Eco Ride welcome">
      <img
        src={photo.src}
        alt="Secure Eco Ride fleet image"
        className="absolute inset-0 h-full w-full object-cover object-[70%_center] lg:static lg:block lg:h-auto lg:object-contain"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-x-4 bottom-4 z-10 rounded-2xl bg-white/95 p-4 shadow-card sm:inset-x-6 sm:bottom-6 sm:p-6 lg:inset-y-0 lg:bottom-auto lg:left-0 lg:right-auto lg:flex lg:w-[46%] lg:flex-col lg:justify-start lg:rounded-none lg:bg-white lg:px-8 lg:pt-28 lg:shadow-none xl:px-14">
        <p className="eyebrow text-moss">Secure Eco Ride</p>
        <h1 className="mt-2 font-display text-[1.75rem] font-black leading-[1.05] tracking-tight text-night sm:text-4xl md:text-5xl">Safe journeys. Cleaner tomorrow.</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-night/75 sm:mt-3 sm:text-base">Reliable, comfortable rides across Rwanda, with a professional driver ready when you are.</p>
        <TrackRideButton className="mt-4 min-h-14 sm:mt-5 sm:min-h-[4.75rem]" />
      </div>
    </section>
  );
}

function QuickBooking() {
  return (
    <section className="relative z-10 mt-0 px-4 sm:-mt-28 sm:px-6 lg:px-8" aria-labelledby="quick-book-title">
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
  const showcase = [
    { image: '/kai1.png', alt: 'White Kia EV5 electric SUV viewed from the rear', title: 'Comfort for city rides', description: 'A modern electric SUV for comfortable trips around town.' },
    { image: '/kai2.png', alt: 'White Kia EV5 electric SUV viewed from the front', title: 'Ready for airport transfers', description: 'A spacious, refined ride for airport pickups and longer journeys.' },
    { image: '/kai3.png', alt: 'White Kia EV5 electric SUV viewed from the side', title: 'A cleaner way to travel', description: 'All-electric travel for business, private and everyday journeys.' },
  ];
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
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {showcase.map((item) => (
              <li key={item.image}>
                <article className="h-full overflow-hidden rounded-3xl bg-mist shadow-card">
                  <img src={item.image} alt={item.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-moss">Kia EV5 · Electric SUV</p>
                    <h3 className="mt-2 font-display text-xl font-black uppercase tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-night/70">{item.description}</p>
                    <Link to="/booking" className="mt-5 inline-flex font-bold text-moss underline decoration-leaf decoration-2 underline-offset-4">Book a ride</Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AirportBand() {
  const bg = { src: photoUrl(STOCK_PHOTOS.airportTerminal, { w: 1600 }), srcSet: photoSrcSet(STOCK_PHOTOS.airportTerminal) };
  return (
    <section className="bg-white pb-16 sm:pb-20 lg:pb-24" aria-labelledby="airport-title">
      <div className="container-x">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-night p-8 text-white sm:p-12 lg:p-16">
          <img src={bg.src} srcSet={bg.srcSet} sizes="(min-width: 1280px) 1200px, 100vw" alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night via-night/85 to-night/30" />
          <div className="relative max-w-2xl">
            <h2 id="airport-title" className="h-display">Airport transfers</h2>
            <div className="rule-green mt-4" />
            <p className="copy-lead mt-5 text-white/85">Reliable airport pickup and drop-off services with professional drivers and scheduled transportation.</p>
            <ul className="mt-6 space-y-2 text-white/90">
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
          <h2 id="corp-title" className="h-display">Corporate &amp; private travel</h2>
          <div className="rule-green mt-4" />
          <p className="copy-lead mt-5 max-w-lg text-white/75">Dependable transport for the people and organisations that cannot afford a late car.</p>
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
