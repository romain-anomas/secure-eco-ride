import { Clock, Leaf, MapPin, ShieldCheck, ThumbsUp, UserCheck } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import Reveal from './Reveal.jsx';

const MAIN = [
  { icon: ShieldCheck, title: 'Safe & secure', text: 'Your safety comes first on every trip, from booking to drop-off.' },
  { icon: Leaf, title: 'Eco friendly', text: 'We care about the air we all share, and work toward cleaner travel.' },
  { icon: UserCheck, title: 'Professional drivers', text: 'Courteous, experienced drivers who know the way and respect your time.' },
];
const MORE = [
  { icon: ThumbsUp, title: 'Reliable service' },
  { icon: Clock, title: 'On-time pickups' },
  { icon: MapPin, title: 'Easy booking' },
];

export default function WhyChoose() {
  return (
    <section className="section bg-night text-white" aria-labelledby="why-title">
      <div className="container-x">
        <SectionHeading title="Why choose Secure Eco Ride?" tone="dark" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {MAIN.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border-2 border-leaf/60 bg-coal p-7">
                <Icon className="h-10 w-10 text-lime" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-5 font-display text-2xl font-black uppercase tracking-tight">{title}</h3>
                <p className="mt-3 leading-relaxed text-white/70">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {MORE.map(({ icon: Icon, title }) => (
            <li key={title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-coal/60 px-5 py-4">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-leaf/60 text-lime"><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="font-display text-base font-extrabold uppercase tracking-tight">{title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
