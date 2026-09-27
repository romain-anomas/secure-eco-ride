import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { formatDate } from '../utils/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { prettyLocal } from '../utils/phone.js';

export default function BookingConfirmation({ result, onReset }) {
  const reduce = useReducedMotion();
  const { phones, tel } = useSettings();
  const s = result.summary || {};
  const fallback = result.whatsappFallback;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      className="text-center"
    >
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf/15 text-moss">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-display text-3xl font-black uppercase tracking-tight">Booking received</h3>
      <p className="mx-auto mt-2 max-w-md text-night/70">{result.message}</p>

      <div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-dashed border-leaf/60 bg-leaf/5 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-night/60">Your booking ID</p>
        <p className="mt-1 font-display text-3xl font-black tracking-tight text-moss">{result.reference}</p>
        <p className="mt-1 text-xs text-night/55">Keep this reference when you contact us.</p>
      </div>

      {s.pickup_location && (
        <dl className="mx-auto mt-6 grid max-w-md gap-x-6 gap-y-3 text-left text-sm sm:grid-cols-2">
          {[
            ['Pickup', s.pickup_location], ['Destination', s.destination],
            ['Date', formatDate(s.pickup_date)], ['Time', s.pickup_time],
            ['Passengers', s.passengers], ['Service', s.service_name],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-xs font-bold uppercase tracking-wider text-night/50">{k}</dt><dd className="font-semibold">{v}</dd></div>
          ))}
        </dl>
      )}

      {phones[0] && (
        <p className="mt-6 text-sm text-night/70">
          Need to change something? Call <a className="font-bold text-moss underline" href={tel(phones[0])}>{prettyLocal(phones[0])}</a> and quote your booking ID.
        </p>
      )}

      {fallback?.links?.length > 0 && (
        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-5 text-left">
          <p className="flex items-center gap-2 font-bold text-amber-900"><MessageCircle className="h-5 w-5" aria-hidden="true" /> Development fallback: WhatsApp not connected</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/85">
            The WhatsApp Business API is not configured on this server, so the team was <strong>not</strong> notified automatically.
            These buttons open WhatsApp with your booking message filled in — <strong>you still have to press Send</strong> in WhatsApp.
          </p>
          <div className="mt-4 grid gap-2">
            {fallback.links.map((l) => (
              <a key={l.recipient} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm justify-start">
                <Phone className="h-4 w-4 text-lime" aria-hidden="true" /> {l.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={onReset} className="btn btn-outline mt-8">Make another booking</button>
    </motion.div>
  );
}
