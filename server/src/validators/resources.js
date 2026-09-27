import { z } from 'zod';
import { boolish, optionalInt, optionalMoney, optionalText, phoneField, requiredText } from './common.js';

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const serviceSchema = z.object({
  name: requiredText(2, 120, 'Service name'),
  slug: optionalText(140),
  description: optionalText(2000),
  icon: z.enum(['car', 'plane', 'briefcase', 'clock', 'shield', 'leaf', 'users', 'map']).default('car'),
  sort_order: optionalInt(-1000, 1000),
  is_bookable: boolish,
  is_active: boolish,
}).transform((v) => ({ ...v, slug: v.slug || slugify(v.name) }));

export const vehicleSchema = z.object({
  name: requiredText(2, 120, 'Vehicle name'),
  model: optionalText(120),
  plate_number: optionalText(30),
  category: requiredText(2, 60, 'Category'),
  capacity: optionalInt(1, 60),
  status: z.enum(['AVAILABLE', 'BUSY', 'MAINTENANCE']).default('AVAILABLE'),
  image_url: optionalText(500),
  description: optionalText(2000),
  features: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  is_public: boolish,
});

export const driverSchema = z.object({
  name: requiredText(2, 120, 'Driver name'),
  phone: phoneField('Driver phone'),
  license_number: optionalText(60),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE']).default('AVAILABLE'),
  vehicle_id: optionalInt(1),
  is_active: boolish,
});

export const pricingSchema = z.object({
  service_id: optionalInt(1),
  name: requiredText(2, 120, 'Rule name'),
  base_price: optionalMoney(),
  price_per_km: optionalMoney(),
  minimum_price: optionalMoney(),
  additional_fees: optionalMoney(),
  currency: z.string().trim().min(2).max(8).default('RWF'),
  notes: optionalText(255),
  is_active: boolish,
});

export const testimonialSchema = z.object({
  customer_name: requiredText(2, 120, 'Customer name'),
  text: requiredText(5, 1200, 'Testimonial text'),
  rating: optionalInt(1, 5),
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']).default('PENDING'),
});

/** PATCH variant: every field optional; defaults must not silently overwrite existing values. */
export const partialOf = (schema) => {
  const base = schema._def.schema ?? schema; // unwrap ZodEffects (services use a transform)
  const relaxed = Object.fromEntries(
    Object.entries(base.shape).map(([k, v]) => [k, v instanceof z.ZodDefault ? v.removeDefault().optional() : v.optional()]),
  );
  return z.object(relaxed).transform((v) => {
    const out = { ...v };
    if ('slug' in out && !out.slug) delete out.slug; // never null a NOT NULL column
    return out;
  });
};
