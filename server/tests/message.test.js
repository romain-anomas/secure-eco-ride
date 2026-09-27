import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBookingMessage, buildBookingTemplateParams, buildContactMessage } from '../src/utils/bookingMessage.js';
import { formatDateLong, isValidDateString, todayInTz } from '../src/utils/dates.js';

const booking = {
  reference: 'SER-2026-00001',
  customer_name: 'John Doe',
  customer_phone: '250788123456',
  pickup_location: 'Kigali City',
  destination: 'Kigali International Airport',
  pickup_date: '2026-09-20',
  pickup_time: '14:30:00',
  passengers: 2,
  service_name: 'Airport Transfers',
  notes: null,
};

test('booking message follows the required structure', () => {
  const msg = buildBookingMessage(booking);
  const expected = [
    '🚕 SECURE ECO RIDE', 'NEW RIDE BOOKING', '', 'Booking ID: SER-2026-00001', '',
    '👤 Customer:', 'John Doe', '', '📞 Phone:', '0788123456', '', '📍 Pickup:', 'Kigali City', '',
    '📍 Destination:', 'Kigali International Airport', '', '📅 Date:', '20 September 2026', '',
    '⏰ Time:', '14:30', '', '👥 Passengers:', '2', '', '🚘 Service:', 'Airport Transfers', '',
    '📝 Notes:', 'None', '', 'Please check the Secure Eco Ride admin dashboard and respond to the customer.',
  ].join('\n');
  assert.equal(msg, expected);
});

test('airport extras appear only when provided', () => {
  const msg = buildBookingMessage({ ...booking, flight_number: 'WB100', airport_direction: 'ARRIVAL', luggage_count: 3 });
  assert.match(msg, /Flight: WB100/);
  assert.match(msg, /Direction: Arrival/);
  assert.match(msg, /Luggage: 3/);
  assert.doesNotMatch(buildBookingMessage(booking), /Airport details/);
});

test('template params are single-line and ordered', () => {
  const p = buildBookingTemplateParams({ ...booking, notes: 'line1\nline2\t   x' });
  assert.equal(p.length, 10);
  assert.equal(p[0], 'SER-2026-00001');
  assert.equal(p[9], 'line1 line2 x');
  assert.ok(p.every((x) => !/[\n\t]/.test(x)));
});

test('contact message', () => {
  const m = buildContactMessage({ type: 'CORPORATE', name: 'Amina', company: 'Acme Ltd', phone: '250788000111', message: 'Need monthly rides' });
  assert.match(m, /NEW CORPORATE SERVICE REQUEST/);
  assert.match(m, /0788000111/);
});

test('date helpers', () => {
  assert.equal(formatDateLong('2026-09-20'), '20 September 2026');
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.match(todayInTz('Africa/Kigali'), /^\d{4}-\d{2}-\d{2}$/);
});
