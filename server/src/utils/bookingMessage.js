import { formatDateLong, formatTimeShort } from './dates.js';
import { toLocalFormat } from './phone.js';

const clean = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim());

/**
 * The exact WhatsApp text sent to every business number.
 * `b` is a booking row joined with customer fields (customer_name, customer_phone).
 */
export function buildBookingMessage(b, countryCode = '250') {
  const lines = [
    '🚕 SECURE ECO RIDE',
    'NEW RIDE BOOKING',
    '',
    `Booking ID: ${b.reference}`,
    '',
    '👤 Customer:',
    b.customer_name,
    '',
    '📞 Phone:',
    toLocalFormat(b.customer_phone, countryCode),
    '',
    '📍 Pickup:',
    b.pickup_location,
    '',
    '📍 Destination:',
    b.destination,
    '',
    '📅 Date:',
    formatDateLong(b.pickup_date),
    '',
    '⏰ Time:',
    formatTimeShort(b.pickup_time),
    '',
    '👥 Passengers:',
    String(b.passengers),
    '',
    '🚘 Service:',
    b.service_name,
  ];

  // Airport details are only added when the customer filled them in
  const airport = [];
  if (clean(b.airport_direction)) airport.push(`Direction: ${b.airport_direction === 'ARRIVAL' ? 'Arrival' : 'Departure'}`);
  if (clean(b.airport_name)) airport.push(`Airport: ${b.airport_name}`);
  if (clean(b.flight_number)) airport.push(`Flight: ${b.flight_number}`);
  if (b.luggage_count !== null && b.luggage_count !== undefined) airport.push(`Luggage: ${b.luggage_count}`);
  if (airport.length) lines.push('', '✈️ Airport details:', ...airport);
  if (clean(b.vehicle_type)) lines.push('', '🚗 Vehicle type:', b.vehicle_type);

  lines.push('', '📝 Notes:', clean(b.notes) || 'None', '', 'Please check the Secure Eco Ride admin dashboard and respond to the customer.');
  return lines.join('\n');
}

/** Template variables cannot contain newlines/tabs or 4+ consecutive spaces (WhatsApp Cloud API rule). */
const param = (v) => (clean(v) || '-').replace(/\s+/g, ' ').slice(0, 900);

/** Ordered parameters {{1}}..{{10}} for the approved template described in the README. */
export function buildBookingTemplateParams(b, countryCode = '250') {
  return [
    b.reference,
    b.customer_name,
    toLocalFormat(b.customer_phone, countryCode),
    b.pickup_location,
    b.destination,
    formatDateLong(b.pickup_date),
    formatTimeShort(b.pickup_time),
    String(b.passengers),
    b.service_name,
    b.notes,
  ].map(param);
}

export function buildContactMessage(c, countryCode = '250') {
  const lines = [
    '🏢 SECURE ECO RIDE',
    c.type === 'CORPORATE' ? 'NEW CORPORATE SERVICE REQUEST' : 'NEW CONTACT MESSAGE',
    '',
    '👤 Name:',
    c.name,
  ];
  if (clean(c.company)) lines.push('', '🏷️ Company:', c.company);
  if (clean(c.phone)) lines.push('', '📞 Phone:', toLocalFormat(c.phone, countryCode));
  if (clean(c.email)) lines.push('', '✉️ Email:', c.email);
  lines.push('', '📝 Message:', c.message, '', 'Please check the Secure Eco Ride admin dashboard (Messages) and reply.');
  return lines.join('\n');
}
