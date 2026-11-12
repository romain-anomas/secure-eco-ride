import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BriefcaseBusiness, Clock3, Leaf, MapPin, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import useServices from '../hooks/useServices.js';
import { useSettings } from '../context/SettingsContext.jsx';
import BookingForm from '../components/BookingForm.jsx';
import FleetCard from '../components/FleetCard.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import WhyChoose from '../components/WhyChoose.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Testimonials from '../components/Testimonials.jsx';
import ContactStrip from '../components/ContactStrip.jsx';
import Reveal from '../components/Reveal.jsx';
import { prettyLocal } from '../utils/phone.js';
import { smartImageProps, STOCK_PHOTOS } from '../utils/images.js';

const PILLARS = [
  [ShieldCheck, 'Safety first', 'Professional drivers and thoughtful service, from pickup to drop-off.'],
  [Clock3, 'On your schedule', 'Book ahead for airport transfers, work trips and everyday journeys.'],
  [Leaf, 'Travel more thoughtfully', 'Comfortable transport with a cleaner journey in mind.'],
];

function Hero() {
  const { settings, primaryPhone, tel } = useSettings();
  const photo = smartImageProps(settings.hero_image_url || STOCK_PHOTOS.heroTaxiNight, { w: 2000 });
  return <>
    <section className="relative isolate flex min-h-[660px] items-center overflow-hidden bg-night pb-28 pt-28 text-white sm:min-h-[720px] sm:pb-36 lg:min-h-[min(820px,92svh)] lg:pt-32" aria-label="Secure Eco Ride welcome">
      <img src={photo.src} srcSet={photo.srcSet} sizes="100vw" alt="A Secure Eco Ride vehicle ready for the journey" className="absolute inset-0 -z-30 h-full w-full object-cover object-center" fetchPriority="high" decoding="async" />
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#07100f]/95 via-[#07100f]/75 to-[#07100f]/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#07100f]/85 via-transparent to-[#07100f]/20" />
      <div className="container-x relative grid w-full items-center gap-12 lg:grid-cols-[1.05fr_.8fr]">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime/40 bg-night/40 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] text-lime backdrop-blur"><Sparkles size={14} /> Kigali rides, thoughtfully arranged</div>
          <h1 className="mt-6 max-w-[13ch] font-sans text-4xl font-extrabold leading-[1.04] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">Safe journeys.<br /><span className="text-lime">Cleaner tomorrow.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">Comfortable, reliable transport for airport transfers, business travel and every important trip across Rwanda.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/booking" className="btn btn-primary min-h-12 px-6">Book your ride <ArrowRight size={17} /></Link>
            <Link to="/fleet" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/5 px-6 text-sm font-bold text-white transition hover:border-lime hover:bg-white/10">Explore our fleet <ArrowDown size={16} /></Link>
          </div>
          {primaryPhone && <p className="mt-6 text-sm text-white/65">Prefer to speak with us? <a className="font-bold text-white underline decoration-lime underline-offset-4" href={tel(primaryPhone)}>{prettyLocal(primaryPhone)}</a></p>}
        </div>
        <div className="hidden justify-self-end lg:block">
          <div className="max-w-xs rounded-2xl border border-white/15 bg-night/45 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf text-night"><MapPin size={19} /></span><div><p className="text-sm font-bold text-white">Your trip, your way</p><p className="text-xs text-white/60">Local rides · airport · business</p></div></div>
            <div className="my-4 border-t border-white/15" />
            <p className="text-sm leading-relaxed text-white/75">Tell us where you’re going and when. Our team will confirm your ride directly.</p>
            <Link to="/booking" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-lime hover:text-white">Plan a journey <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0b1011] to-transparent" />
    </section>
    <QuickBooking />
  </>;
}

function QuickBooking() {
  return <section id="quick-booking" className="relative z-10 -mt-20 px-4 sm:-mt-24 sm:px-6 lg:-mt-28 lg:px-8" aria-labelledby="quick-book-title">
    <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#11191b]/95 p-5 shadow-[0_28px_80px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="eyebrow text-lime">Start with the details</p><h2 id="quick-book-title" className="mt-1 font-sans text-2xl font-bold tracking-tight text-white sm:text-3xl">Plan your ride</h2></div><p className="max-w-sm text-xs leading-relaxed text-white/55">Share your trip details and our team will get back to confirm.</p></div>
      <div className="mt-5 rounded-2xl bg-white p-4 sm:p-5"><BookingForm mode="quick" /></div>
    </div>
  </section>;
}

function TrustStrip() {
  return <section className="px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8" aria-label="Our service commitments"><ul className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
    {PILLARS.map(([Icon, title, text]) => <li key={title} className="flex items-start gap-4 bg-[#101719] p-5 sm:p-6"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-leaf/10 text-lime"><Icon size={21} /></span><div><p className="font-bold text-white">{title}</p><p className="mt-1 text-xs leading-relaxed text-white/55">{text}</p></div></li>)}
  </ul></section>;
}

function Services() {
  const { services, priceFor } = useServices();
  return <section className="section" aria-labelledby="services-title"><div className="container-x"><SectionHeading title="A ride for every occasion" intro="From everyday journeys to airport pickups and business travel, we make getting there easier." tone="dark" />
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.slice(0, 4).map((service, i) => { const Icon = [MapPin, BriefcaseBusiness, Zap, Users][i % 4]; return <Reveal as="li" key={service.id} delay={i * .05}><Link to={`/booking?service=${encodeURIComponent(service.slug || '')}`} className="group flex h-full min-h-52 flex-col rounded-2xl border border-white/10 bg-[#11191b] p-5 transition hover:-translate-y-1 hover:border-leaf/60 hover:bg-[#151f20] sm:p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf/10 text-lime"><Icon size={21} /></span><h3 className="mt-5 text-lg font-bold text-white">{service.name}</h3><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">{service.description || 'Comfortable, professional transport tailored to your journey.'}</p><span className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs font-bold text-lime">{priceFor(service) || 'Request this service'}<ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></Link></Reveal>; })}</ul>
  </div></section>;
}

function FleetPreview() {
  const { data, loading } = useFetch('/fleet', { initial: [] });
  const vehicles = (data || []).slice(0, 3);
  return <section className="section bg-[#0e1517]" aria-labelledby="fleet-title"><div className="container-x"><div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading title="Meet the fleet" intro="Vehicles selected for comfort, safety and the needs of your journey." tone="dark" /><Link to="/fleet" className="btn btn-outline-light btn-sm">Explore all vehicles <ArrowRight size={15} /></Link></div>
    {loading ? <div className="mt-10 h-64 animate-pulse rounded-3xl bg-white/5" aria-label="Loading vehicles" /> : vehicles.length ? <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{vehicles.map((vehicle) => <li key={vehicle.id}><FleetCard vehicle={vehicle} /></li>)}</ul> : <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center"><p className="text-sm text-white/65">Our team is preparing the fleet details.</p><Link to="/booking" className="btn btn-primary btn-sm mt-4">Request a ride</Link></div>}
  </div></section>;
}

function BusinessBand() {
  return <section className="px-4 py-10 sm:px-6 lg:px-8"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-leaf/30 bg-gradient-to-br from-[#1c2b1b] via-[#14211b] to-[#101719] p-7 sm:p-10 lg:p-12"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-leaf/10 blur-3xl" /><div className="relative flex flex-col items-start justify-between gap-7 md:flex-row md:items-center"><div className="max-w-2xl"><span className="eyebrow text-lime">For teams and organisations</span><h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-white sm:text-4xl">Reliable transport for work that matters.</h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">Arrange dependable journeys for your staff, clients and guests. Tell us what you need and we’ll help plan the details.</p></div><Link to="/corporate" className="btn btn-primary shrink-0">Explore corporate travel <ArrowRight size={16} /></Link></div></div></section>;
}

export default function Home() {
  useSeo({ title: 'Secure Eco Ride | Safe & Reliable Taxi Services', description: 'Book safe, reliable transport in Rwanda with Secure Eco Ride. Airport transfers, business travel and private rides with professional drivers.' });
  return <div className="home-page"><Hero /><TrustStrip /><Services /><FleetPreview /><WhyChoose /><HowItWorks /><Testimonials /><BusinessBand /><ContactStrip heading="Wherever you’re going, let’s get you there." /></div>;
}
