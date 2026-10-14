import { Leaf, ShieldCheck, UserCheck } from 'lucide-react';
import useSeo from '../hooks/useSeo.js';
import { useSettings } from '../context/SettingsContext.jsx';
import PageHero from '../components/PageHero.jsx';
import ContactStrip from '../components/ContactStrip.jsx';
import { STOCK_PHOTOS } from '../utils/images.js';

const VALUES = [
  [ShieldCheck, 'Safe & secure', 'Safe transportation is the starting point of everything we do.'],
  [UserCheck, 'Professional service', 'Professional drivers and a team that confirms every booking personally.'],
  [Leaf, 'Eco-friendly vision', 'Reliable journeys today, and a cleaner tomorrow for everyone.'],
];

export default function About() {
  const { settings } = useSettings();
  useSeo({ title: 'About Us | Secure Eco Ride', description: settings.company_description });
  const paragraphs = (settings.about_text || '').split(/\n+/).filter(Boolean);
  return (
    <>
      <PageHero title="About Secure Eco Ride" intro={settings.slogan} image={STOCK_PHOTOS.heroTaxiNight} imageAlt="A taxi driving through the city at night" />
      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-night/75">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <ul className="space-y-4">
            {VALUES.map(([Icon, t, d]) => (
              <li key={t} className="flex gap-4 rounded-3xl border-2 border-leaf/50 bg-mist p-5">
                <Icon className="h-8 w-8 shrink-0 text-moss" strokeWidth={1.5} aria-hidden="true" />
                <div><h3 className="font-display text-lg font-black uppercase tracking-tight">{t}</h3><p className="mt-1 text-night/70">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ContactStrip />
    </>
  );
}
