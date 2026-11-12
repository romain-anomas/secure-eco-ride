import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, CarFront, Check, Clock3, ClipboardList, KeyRound, MessageCircle, Search, ShieldCheck, Users, Zap } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import useFetch from '../hooks/useFetch.js';
import { useSettings } from '../context/SettingsContext.jsx';
import FleetCard from '../components/FleetCard.jsx';
import Testimonials from '../components/Testimonials.jsx';
import Reveal from '../components/Reveal.jsx';
import { smartImageProps, STOCK_PHOTOS } from '../utils/images.js';

const PILLARS = [
  [ShieldCheck, 'Safety minded', 'Professional drivers and clear communication', 'text-emerald-700 bg-emerald-50'],
  [Users, 'People first', 'Helpful support from booking through drop-off', 'text-sky-700 bg-sky-50'],
  [CarFront, 'Comfortable rides', 'A fleet for everyday and scheduled journeys', 'text-violet-700 bg-violet-50'],
  [Clock3, 'On your schedule', 'Plan your ride when it works for you', 'text-amber-700 bg-amber-50'],
];

const STEPS = [
  [Search, 'Plan your ride', 'Choose your pickup, destination and service.'],
  [CalendarDays, 'Pick a time', 'Tell us the date and time that suits you.'],
  [ClipboardList, 'Add your details', 'Share your contact information and any requests.'],
  [Check, 'Get confirmation', 'We’ll send your booking reference and confirm the trip.'],
  [KeyRound, 'Ride with confidence', 'Your driver will meet you at the agreed pickup.'],
];

function Hero() {
  const { settings } = useSettings();
  const reduceMotion = useReducedMotion();
  const photo = smartImageProps(settings.hero_image_url || STOCK_PHOTOS.fleetSuv, { w: 2000 });
  return <section className="relative isolate flex min-h-[580px] items-center overflow-hidden bg-[#f4f7f5] py-28 text-night sm:min-h-[640px] sm:py-32 lg:min-h-[700px]" aria-label="Secure Eco Ride welcome">
    <motion.img src={photo.src} srcSet={photo.srcSet} sizes="100vw" alt="A Secure Eco Ride vehicle ready for the journey" className="absolute inset-0 -z-30 h-full w-full object-cover object-[58%_center] sm:object-[68%_center] lg:object-[62%_center]" fetchPriority="high" decoding="async" initial={reduceMotion ? false : { scale: 1.025 }} animate={reduceMotion ? undefined : { scale: 1 }} transition={reduceMotion ? undefined : { duration: 1.4, ease: 'easeOut' }} />
    <motion.div className="container-x relative w-full" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}><div className="max-w-2xl">
      <p className="inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/85 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] text-emerald-800 shadow-sm backdrop-blur"><Zap size={14} className="text-amber-600" /> Secure Eco Ride · Rwanda</p>
      <h1 className="mt-5 max-w-[13ch] font-sans text-4xl font-extrabold leading-[1.04] tracking-[-.055em] text-[#ffffff] drop-shadow-[0_2px_4px_rgba(0,0,0,.8)] sm:text-6xl lg:text-7xl">Safe rides,<br />made <span className="text-amber-300">easy.</span></h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[#ffffff] drop-shadow-[0_1px_3px_rgba(0,0,0,.9)] sm:text-lg">Reliable journeys for airport transfers, business travel and everyday trips. Tell us where you’re going and we’ll help with the rest.</p>
      <div className="mt-7 flex flex-wrap gap-3"><Link to="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-night transition hover:bg-amber-300">Book a ride <ArrowRight size={16} /></Link><Link to="/fleet" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-night/15 bg-white/80 px-5 text-sm font-bold text-night transition hover:border-emerald-600 hover:bg-white">Explore fleet</Link></div>
    </div></motion.div>
  </section>;
}

function BookingCallout() {
  return <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8"><div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl border border-emerald-700/15 bg-gradient-to-r from-white via-white to-emerald-50 p-6 shadow-sm sm:flex-row sm:items-center sm:p-8"><div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" /><div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-800">A simpler way to get there</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-night sm:text-3xl">Your next ride starts here.</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-night/65">Send a request online. Our team will follow up to confirm your trip details.</p></div><Link to="/booking" className="relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-extrabold text-night hover:bg-amber-300">Start booking <ArrowRight size={16} /></Link></div></section>;
}

function TrustRow() {
  return <section className="px-4 pt-5 sm:px-6 lg:px-8" aria-label="What you can expect"><ul className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-2xl border border-night/10 bg-white sm:grid-cols-4">{PILLARS.map(([Icon, title, detail, tone]) => <li key={title} className="flex min-h-28 flex-col items-center justify-center gap-2 border-b border-r border-night/5 bg-white px-3 py-5 text-center last:border-r-0 sm:min-h-32"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon className="h-6 w-6" strokeWidth={1.7} /></span><span className="text-sm font-bold text-night">{title}</span><span className="max-w-48 text-[11px] leading-relaxed text-night/55">{detail}</span></li>)}</ul></section>;
}

function FleetPreview() {
  const { data, loading } = useFetch('/fleet', { initial: [] });
  const vehicles = (data || []).slice(0, 4);
  return <section className="bg-[#f3f6f4] px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="fleet-title"><div className="mx-auto max-w-6xl"><div className="mb-9 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">Comfort for the journey</p><h2 id="fleet-title" className="mt-2 text-2xl font-extrabold tracking-tight text-night sm:text-3xl">Find the right ride</h2><p className="mt-2 text-sm text-night/55">Explore vehicles currently listed by our team.</p></div><Link to="/fleet" className="inline-flex items-center gap-2 rounded-xl border border-night/15 bg-white px-4 py-2.5 text-sm font-bold text-night transition hover:border-emerald-600 hover:text-emerald-800">View full fleet <ArrowRight size={15} /></Link></div>
    {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-white" />)}</div> : vehicles.length ? <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{vehicles.map((vehicle) => <li key={vehicle.id}><FleetCard vehicle={vehicle} /></li>)}</ul> : <div className="rounded-2xl border border-dashed border-night/15 bg-white p-8 text-center"><CarFront className="mx-auto h-8 w-8 text-emerald-700" /><p className="mt-3 text-sm text-night/65">Fleet information is being updated. You can still request a ride.</p><Link to="/booking" className="mt-4 inline-flex text-sm font-bold text-emerald-800 hover:text-night">Book a ride <ArrowRight size={15} /></Link></div>}
  </div></section>;
}

function HowToBook() {
  const tones = ['text-emerald-700 bg-emerald-50 border-emerald-100', 'text-sky-700 bg-sky-50 border-sky-100', 'text-violet-700 bg-violet-50 border-violet-100', 'text-amber-700 bg-amber-50 border-amber-100', 'text-teal-700 bg-teal-50 border-teal-100'];
  return <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8" aria-labelledby="steps-title"><div className="mx-auto max-w-6xl rounded-2xl border border-night/10 bg-white p-6 shadow-sm sm:p-8"><div className="text-center"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-800">Simple from start to finish</p><h2 id="steps-title" className="mt-2 text-2xl font-extrabold text-night sm:text-3xl">How to book your ride</h2></div><ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">{STEPS.map(([Icon, title, detail], i) => <li key={title} className="relative flex flex-col items-center text-center"><span className={`grid h-14 w-14 place-items-center rounded-full border ${tones[i]}`}><Icon size={24} /></span><span className="mt-3 text-sm font-extrabold text-night">{i + 1}. {title}</span><span className="mt-1 max-w-48 text-xs leading-relaxed text-night/55">{detail}</span></li>)}</ol></div></section>;
}

function WhatsAppBand() {
  const { primaryWhatsApp, wa } = useSettings();
  return <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-8"><div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 overflow-hidden rounded-2xl bg-amber-400 px-6 py-8 text-center text-night sm:flex-row sm:px-10 sm:text-left"><div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[24px] border-night/5" /><div className="relative"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-night/65">Need a ride?</p><h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Talk to our team.</h2><p className="mt-1 text-sm text-night/75">We’ll help you plan your trip and answer your questions.</p></div>{primaryWhatsApp ? <a href={wa(primaryWhatsApp, 'Hello Secure Eco Ride, I would like to ask about booking a ride.')} target="_blank" rel="noopener noreferrer" className="relative inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-900 px-5 text-sm font-bold text-white transition hover:bg-emerald-950"><MessageCircle size={18} /> Chat on WhatsApp</a> : <Link to="/contact" className="relative inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-900 px-5 text-sm font-bold text-white transition hover:bg-emerald-950">Contact us <ArrowRight size={16} /></Link>}</div></section>;
}

export default function Home() {
  useSeo({ title: 'Secure Eco Ride | Safe & Reliable Taxi Services', description: 'Book safe, reliable transport in Rwanda with Secure Eco Ride. Airport transfers, business travel and private rides with professional drivers.' });
  return <div className="home-page"><Hero /><BookingCallout /><TrustRow /><FleetPreview /><HowToBook /><div className="home-reviews"><Testimonials /></div><WhatsAppBand /></div>;
}
