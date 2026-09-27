import { z } from 'zod';
import { config } from '../config/env.js';
import { isValidDateString, todayInTz } from '../utils/dates.js';
import { BOOKING_STATUSES } from '../services/bookingService.js';
import { boolish, optionalEmail, optionalInt, optionalPhone, optionalText, phoneField, requiredText } from './common.js';

export const createBookingSchema = z.object({
  customer_name: requiredText(2, 120, 'Your name'),
  phone: phoneField('Phone number'),
  email: optionalEmail(),
  pickup_location: requiredText(2, 255, 'Pickup location'),
  destination: requiredText(2, 255, 'Destination'),
  pickup_date: z.string({ required_error: 'Date is required' })
    .refine(isValidDateString, 'Choose a valid date')
    .refine((d) => d >= todayInTz(config.timezone), 'The date cannot be in the past'),
  pickup_time: z.string({ required_error: 'Time is required' }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a valid time'),
  passengers: z.coerce.number({ invalid_type_error: 'Enter the number of passengers' }).int().min(1, 'At least 1 passenger').max(50, 'Too many passengers — please call us'),
  service_id: z.coerce.number({ invalid_type_error: 'Choose a service' }).int().positive('Choose a service'),
  vehicle_type: optionalText(60),
  notes: optionalText(1000),
  flight_number: optionalText(30),
  airport_direction: z.preprocess((v) => (v === '' ? null : v), z.enum(['ARRIVAL', 'DEPARTURE']).nullable().optional()),
  airport_name: optionalText(120),
  luggage_count: optionalInt(0, 50),
  website: z.string().max(0).optional(), // honeypot: real users never fill this
});

export const listBookingsQuery = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  date_from: z.string().refine(isValidDateString).optional(),
  date_to: z.string().refine(isValidDateString).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const statusSchema = z.object({ status: z.enum(BOOKING_STATUSES), note: optionalText(255) });
export const assignSchema = z.object({ driver_id: z.coerce.number().int().positive(), vehicle_id: optionalInt(1) });
export const bookingUpdateSchema = z.object({ admin_notes: optionalText(2000), quoted_price: z.preprocess((v) => (v === '' ? null : v), z.coerce.number().min(0).nullable().optional()) });

export const contactSchema = z.object({
  type: z.enum(['GENERAL', 'CORPORATE']).default('GENERAL'),
  name: requiredText(2, 120, 'Your name'),
  company: optionalText(160),
  phone: optionalPhone(),
  email: optionalEmail(),
  message: requiredText(5, 3000, 'Message'),
  website: z.string().max(0).optional(),
}).refine((v) => v.phone || v.email, { message: 'Provide a phone number or an email so we can reply', path: ['phone'] });

export const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email'), password: z.string().min(1, 'Password is required').max(200) });

export const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(10, 'Use at least 10 characters').max(200),
});

export const userCreateSchema = z.object({
  name: requiredText(2, 120, 'Name'),
  email: z.string().trim().email().max(190),
  password: z.string().min(10, 'Use at least 10 characters').max(200),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  is_active: boolish,
});
export const userUpdateSchema = z.object({
  name: requiredText(2, 120, 'Name').optional(),
  email: z.string().trim().email().max(190).optional(),
  password: z.preprocess((v) => (v === '' ? undefined : v), z.string().min(10, 'Use at least 10 characters').max(200).optional()),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  is_active: boolish,
});

export const customerUpdateSchema = z.object({ name: requiredText(2, 120).optional(), email: optionalEmail(), notes: optionalText(2000), is_blocked: boolish });
export const contactUpdateSchema = z.object({ status: z.enum(['NEW', 'READ', 'REPLIED']) });
export const testMessageSchema = z.object({}).passthrough();

const url = z.preprocess((v) => (v === null ? '' : v), z.string().trim().max(500));
const phoneList = z.array(z.string().trim().min(1)).max(6).refine((arr) => arr.every((p) => phoneField().safeParse(p).success), 'One of the phone numbers is not valid');
export const settingsSchema = z.object({
  company_name: requiredText(2, 120).optional(),
  slogan: z.string().trim().max(200).optional(),
  tagline: z.string().trim().max(300).optional(),
  company_description: z.string().trim().max(1000).optional(),
  about_text: z.string().trim().max(5000).optional(),
  phone_numbers: phoneList.optional(),
  whatsapp_numbers: phoneList.optional(),
  email: z.string().trim().max(190).refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email').optional(),
  address: z.string().trim().max(300).optional(),
  service_areas: z.string().trim().max(500).optional(),
  business_hours: z.string().trim().max(300).optional(),
  social_links: z.object({ facebook: url, instagram: url, twitter: url, tiktok: url, youtube: url }).partial().optional(),
  logo_url: url.optional(),
  hero_image_url: url.optional(),
  show_prices: boolish,
  currency: z.string().trim().min(2).max(8).optional(),
});
