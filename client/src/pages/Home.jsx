import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, CarFront, Check, Clock3, ClipboardList, KeyRound, MapPin, MessageCircle, Search, ShieldCheck, Users, Zap } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import { useSettings } from '../context/SettingsContext.jsx';
import FleetCard from '../components/FleetCard.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Reveal from '../components/Reveal.jsx';
import { smartImageProps, STOCK_PHOTOS } from '../utils/images.js';
import { todayISO } from '../utils/format.js';

const PILLARS = [
  [ShieldCheck, 'Safety minded', 'Professional drivers and clear communication'],
  [Users, 'People first', 'Helpful support from booking through drop-off'],
  [CarFront, 'Comfortable rides', 'A fleet for everyday and scheduled journeys'],
  [Clock3, 'On your schedule', 'Plan your ride when it works for you'],
];

const STEPS = [
  [Search, 'Plan your ride', 'Choose your pickup, destination and service.'],
  [CalendarDays, 'Pick a time', 'Tell us the date and time that suits you.'],
  [ClipboardList, 'Add your details', 'Share your contact information and any requests.'],
  [Check, 'Get confirmation', 'We’ll send your booking reference and confirm the trip.'],
  [KeyRound, 'Ride with confidence', 'Your driver will meet you at the agreed pickup.'],
];

function TripSearch() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState({ pickup_location: '', destination: '', pickup_date: '' });
  const update = (event) => setTrip((current) => ({ ...current, [event.target.name]: event.target.value }));
  function submit(event) {
    event.preventDefault();
    const query = new URLSearchParams(Object.entries(trip).filter(([, value]) => value.trim()));
    const search = query.toString();
    navigate(`/booking${search ? `?${search}` : ''}`);
  }
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/15 bg-[#0b1116]/90 p-4 shadow-2xl backdrop-blur-xl sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_.8fr_auto] lg:items-end">
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-white/75">Pickup location</span><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" /><input name="pickup_location" value={trip.pickup_location} onChange={update} placeholder="Where should we pick you up?" autoComplete="street-address" className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25" /></span></label>
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-white/75">Destination</span><span className="relative block"><MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" /><input name="destination" value={trip.destination} onChange={update} placeholder="Where are you going?" className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25" /></span></label>
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-white/75">Pickup date</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" /><input name="pickup_date" type="date" min={todayISO()} value={trip.pickup_date} onChange={update} className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-3 text-sm text-white [color-scheme:dark] focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25" /></span></label>
    <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-night transition hover:bg-amber-300 sm:col-span-2 lg:col-span-1"><Search size={16} /> Plan ride</button>
  </form>;
}

function Hero() {
  const { settings } = useSettings();
  const photo = smartImageProps(settings.hero_image_url || STOCK_PHOTOS.heroTaxiNight, { w: 2000 });
  return <section className="relative isolate flex min-h-[620px] items-center overflow-hidden bg-[#071018] pb-32 pt-28 text-white sm:min-h-[690px] sm:pb-36 lg:min-h-[720px] lg:pt-28" aria-label="Secure Eco Ride welcome">
    <img src={photo.src} srcSet={photo.srcSet} sizes="100vw" alt="A Secure Eco Ride vehicle ready for the journey" className="absolute inset-0 -z-30 h-full w-full object-cover object-center" fetchPriority="high" decoding="async" />
    <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#061018]/95 via-[#061018]/75 to-[#061018]/15" />
    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#071018] via-transparent to-[#071018]/35" />
    <div className="container-x relative w-full"><div className="max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-black/25 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] text-amber-300 backdrop-blur"><Zap size={14} /> Secure Eco Ride · Rwanda</p>
      <h1 className="mt-5 max-w-[13ch] font-sans text-4xl font-extrabold leading-[1.04] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">Safe rides,<br />made <span className="text-amber-400">easy.</span></h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">Reliable journeys for airport transfers, business travel and everyday trips. Tell us where you’re going and we’ll help with the rest.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link to="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-night transition hover:bg-amber-300">Book a ride <ArrowRight size={16} /></Link><Link to="/fleet" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 text-sm font-bold text-white transition hover:border-amber-300 hover:bg-white/10">Explore fleet</Link></div>
    </div></div>
    <div className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 lg:px-8"><div className="mx-auto mb-[-42px] max-w-6xl"><TripSearch /></div></div>
  </section>;
}

function BookingCallout() {
  return <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8"><div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-amber-400/60 bg-gradient-to-r from-[#111a20] via-[#121a1d] to-[#101820] p-6 sm:flex-row sm:items-center sm:p-8"><div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" /><div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-amber-300">A simpler way to get there</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Your next ride starts here.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">Send a request online. Our team will follow up to confirm your trip details.</p></div><Link to="/booking" className="relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-night hover:bg-amber-300">Start booking <ArrowRight size={16} /></Link></div></section>;
}

function TrustRow() {
  return <section className="px-4 pt-5 sm:px-6 lg:px-8" aria-label="What you can expect"><ul className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">{PILLARS.map(([Icon, title, detail]) => <li key={title} className="flex min-h-28 flex-col items-center justify-center gap-2 bg-[#0d151a] px-3 py-5 text-center sm:min-h-32"><Icon className="h-7 w-7 text-amber-400" strokeWidth={1.7} /><span className="text-sm font-bold text-white">{title}</span><span className="max-w-48 text-[11px] leading-relaxed text-white/50">{detail}</span></li>)}</ul></section>;
}

function FleetPreview() {
  const { data, loading } = useFetch('/fleet', { initial: [] });
  const vehicles = (data || []).slice(0, 4);
  return <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="fleet-title"><div className="mx-auto max-w-6xl"><div className="mb-9 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-amber-400">Comfort for the journey</p><h2 id="fleet-title" className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find the right ride</h2><p className="mt-2 text-sm text-white/55">Explore vehicles currently listed by our team.</p></div><Link to="/fleet" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:border-amber-400 hover:text-amber-300">View full fleet <ArrowRight size={15} /></Link></div>
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-white/5" />)}</div> : vehicles.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{vehicles.map((vehicle) => <li key={vehicle.id}><FleetCard vehicle={vehicle} /></li>)}</ul> : <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center"><CarFront className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-3 text-sm text-white/65">Fleet information is being updated. You can still request a ride.</p><Link to="/booking" className="mt-4 inline-flex text-sm font-bold text-amber-300 hover:text-white">Book a ride <ArrowRight size={15} /></Link></div>}
  </div></section>;
}

function HowToBook() {
  return <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8" aria-labelledby="steps-title"><div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#0e161c] p-6 sm:p-8"><div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-amber-400">Simple from start to finish</p><h2 id="steps-title" className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">How to book your ride</h2></div><ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">{STEPS.map(([Icon, title, detail], i) => <li key={title} className="relative flex flex-col items-center text-center"><span className="grid h-14 w-14 place-items-center rounded-full border border-amber-400/35 bg-black/20 text-amber-400"><Icon size={24} /></span><span className="mt-3 text-sm font-extrabold text-white">{i + 1}. {title}</span><span className="mt-1 max-w-48 text-xs leading-relaxed text-white/55">{detail}</span></li>)}</ol></div></section>;
}

function WhatsAppBand() {
  const { primaryWhatsApp, wa } = useSettings();
  return <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8"><div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 overflow-hidden rounded-2xl bg-amber-400 px-6 py-8 text-center text-night sm:flex-row sm:px-10 sm:text-left"><div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[24px] border-night/5" /><div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-night/65">Need a ride?</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Talk to our team.</h2><p className="mt-1 text-sm text-night/75">We’ll help you plan your trip and answer your questions.</p></div>{primaryWhatsApp ? <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride, I would like to ask about booking a ride.')} target="_blank" rel="noopener noreferrer" className="relative inline-flex min-h-12 items-center gap-2 rounded-xl bg-night px-5 text-sm font-bold text-white transition hover:bg-[#172125]"><MessageCircle size={18} /> Chat on WhatsApp</a> : <Link to="/contact" className="relative inline-flex min-h-12 items-center gap-2 rounded-xl bg-night px-5 text-sm font-bold text-white transition hover:bg-[#172125]">Contact us <ArrowRight size={16} /></Link>}</div></section>;
}

export default function Home() {
  useSeo({ title: 'Secure Eco Ride | Safe & Reliable Taxi Services', description: 'Book safe, reliable transport in Rwanda with Secure Eco Ride. Airport transfers, business travel and private rides with professional drivers.' });
  return <div className="home-page"><Hero /><BookingCallout /><TrustRow /><FleetPreview /><HowToBook /><div className="home-reviews"><Testimonials /></div><WhatsAppBand /></div>;
}
