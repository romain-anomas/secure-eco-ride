import useSeo from '../hooks/useSeo.js';
import { useSettings } from '../context/SettingsContext.jsx';
import PageHero from '../components/PageHero.jsx';

function Doc({ title, children }) {
  return (
    <>
      <PageHero title={title} />
      <section className="section bg-white">
        <div className="container-x max-w-3xl space-y-8 leading-relaxed text-night/80 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-night [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          {children}
        </div>
      </section>
    </>
  );
}

function Contact() {
  const { settings, phones } = useSettings();
  return <>Contact us on {phones.join(', ')}{settings.email ? ` or ${settings.email}` : ''}.</>;
}

export function Privacy() {
  const { settings } = useSettings();
  useSeo({ title: 'Privacy Policy | Secure Eco Ride', description: 'How Secure Eco Ride collects and uses your information when you book a ride.' });
  return (
    <Doc title="Privacy policy">
      <section><h2>Who we are</h2><p>{settings.company_name} provides taxi and transportation services. This page explains what information we collect when you use this website and how we use it.</p></section>
      <section><h2>What we collect</h2><ul><li>Booking details: your name, phone number, optional email, pickup and destination, date, time, passengers and any notes you add.</li><li>Airport details you choose to provide, such as flight number.</li><li>Messages you send through our contact and corporate forms.</li></ul></section>
      <section><h2>How we use it</h2><ul><li>To confirm, arrange and carry out your ride.</li><li>To contact you about your booking by phone or WhatsApp.</li><li>To keep records of bookings and improve our service.</li></ul></section>
      <section><h2>Who sees it</h2><p>Your booking is sent to our team, including by WhatsApp message, and to the driver assigned to your ride. We use messaging and hosting providers to operate the service. We do not sell your personal information.</p></section>
      <section><h2>How long we keep it</h2><p>We keep booking records for as long as needed to run our business and meet legal obligations.</p></section>
      <section><h2>Your choices</h2><p>You can ask us to correct or delete your information, subject to legal requirements. <Contact /></p></section>
    </Doc>
  );
}

export function Terms() {
  const { settings } = useSettings();
  useSeo({ title: 'Terms & Conditions | Secure Eco Ride', description: 'Terms of using Secure Eco Ride booking and transport services.' });
  return (
    <Doc title="Terms & conditions">
      <section><h2>Bookings</h2><p>Submitting the booking form is a request. A ride is arranged once our team confirms it with you by phone or WhatsApp. Please give accurate pickup details and a phone number we can reach.</p></section>
      <section><h2>Fares</h2><p>Fares depend on distance, time and vehicle and are confirmed with you before the ride unless otherwise agreed.</p></section>
      <section><h2>Changes and cancellations</h2><p>If your plans change, contact us as early as possible so we can update or cancel your booking. <Contact /></p></section>
      <section><h2>Passenger conduct and safety</h2><p>For everyone's safety, passengers should wear seat belts, respect the driver and vehicle, and follow reasonable instructions from the driver.</p></section>
      <section><h2>Delays</h2><p>We plan every pickup to be on time. Traffic, weather and flight changes can affect timings, and we will keep you informed when we can.</p></section>
      <section><h2>Contact</h2><p>{settings.company_name}. <Contact /></p></section>
    </Doc>
  );
}
