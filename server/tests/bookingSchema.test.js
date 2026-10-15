import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingSchema } from '../src/validators/schemas.js';
import { todayInTz } from '../src/utils/dates.js';

const tomorrow = () => {
  const [year, month, day] = todayInTz('Africa/Kigali').split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
};

const booking = (overrides = {}) => ({
  customer_name: 'Test Customer', phone: '0793157373', email: 'test@example.com',
  pickup_location: 'Kigali city', destination: 'Kigali airport',
  pickup_date: tomorrow(), pickup_time: '12:30', passengers: 1, service_id: 1,
  ...overrides,
});

test('booking coordinates are optional for legacy-compatible requests', () => {
  assert.equal(createBookingSchema.safeParse(booking()).success, true);
});

test('valid coordinates and email are accepted', () => {
  const parsed = createBookingSchema.safeParse(booking({ pickup_latitude: -1.9441, pickup_longitude: 30.0619 }));
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, 'test@example.com');
});

test('invalid and incomplete coordinate pairs are rejected', () => {
  assert.equal(createBookingSchema.safeParse(booking({ pickup_latitude: 91, pickup_longitude: 30 })).success, false);
  assert.equal(createBookingSchema.safeParse(booking({ pickup_latitude: -1.9 })).success, false);
});

test('invalid or missing email is rejected for new bookings', () => {
  assert.equal(createBookingSchema.safeParse(booking({ email: 'not-an-email' })).success, false);
  const request = booking();
  delete request.email;
  assert.equal(createBookingSchema.safeParse(request).success, false);
});
