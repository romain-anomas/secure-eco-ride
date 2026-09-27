import SectionHeading from './SectionHeading.jsx';

const STEPS = [
  ['Book', 'Choose your pickup, destination and time.'],
  ['Confirm', 'Our team confirms your ride.'],
  ['Pickup', 'Your professional driver arrives.'],
  ['Ride', 'Enjoy a safe and reliable journey.'],
];

export default function HowItWorks() {
  return (
    <section className="section bg-mist" aria-labelledby="how-title">
      <div className="container-x">
        <SectionHeading title="How it works" />
        <div className="relative mt-12">
          <svg className="pointer-events-none absolute left-0 right-0 top-4 hidden h-24 w-full lg:block" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="route-draw" d="M60 50C200 -10 300 110 440 50S700 -10 940 50" fill="none" stroke="rgb(var(--c-green))" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="text-center lg:text-left">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-night font-display text-2xl font-black text-lime ring-4 ring-mist lg:mx-0">{i + 1}</span>
                <h3 className="mt-5 font-display text-xl font-black uppercase tracking-tight">{title}</h3>
                <p className="mt-2 text-night/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
