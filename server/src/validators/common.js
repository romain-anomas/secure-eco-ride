import { z } from 'zod';
import { config } from '../config/env.js';
import { normalizePhone } from '../utils/phone.js';

/** '' -> null, otherwise trimmed string (undefined stays undefined so PATCH leaves the column alone). */
export const optionalText = (max = 255) =>
  z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v), z.string().max(max).nullable().optional());

export const requiredText = (min = 1, max = 255, label = 'This field') =>
  z.string({ required_error: `${label} is required` }).trim().min(min, `${label} is required`).max(max, `${label} is too long`);

const toNum = (v) => (v === undefined ? undefined : v === '' || v === null ? null : Number(v));

export const optionalInt = (min = 0, max = 1_000_000) =>
  z.preprocess(toNum, z.number().int().min(min).max(max).nullable().optional());

export const optionalMoney = () =>
  z.preprocess(toNum, z.number().min(0).max(1_000_000_000).nullable().optional());

export const boolish = z.preprocess((v) => {
  if (v === undefined) return undefined;
  return v === true || v === 1 || v === '1' || v === 'true';
}, z.boolean().optional());

export const phoneField = (label = 'Phone number') =>
  z.string({ required_error: `${label} is required` }).trim().min(1, `${label} is required`).max(30)
    .refine((v) => normalizePhone(v, config.countryCode) !== null, 'Enter a valid phone number, e.g. 0793157373');

export const optionalPhone = () =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    phoneField().nullable().optional());

export const optionalEmail = () =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().email('Enter a valid email address').max(190).nullable().optional());

export const idParam = z.object({ id: z.coerce.number().int().positive() });
