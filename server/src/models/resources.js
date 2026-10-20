import { createCrud } from './crud.js';

export const Services = createCrud({
  table: 'services',
  fields: ['name', 'slug', 'description', 'icon', 'sort_order', 'is_bookable', 'is_active'],
  orderBy: 't.sort_order ASC, t.id ASC',
});

export const Vehicles = createCrud({
  table: 'vehicles',
  fields: ['name', 'model', 'plate_number', 'category', 'capacity', 'status', 'image_url', 'description', 'features', 'is_public'],
  json: ['features'],
  orderBy: 't.category ASC, t.name ASC',
});

export const Drivers = createCrud({
  table: 'drivers',
  fields: ['name', 'phone', 'license_number', 'status', 'vehicle_id', 'is_active'],
  selectSql: 'SELECT t.*, v.name AS vehicle_name, v.plate_number AS vehicle_plate, u.email AS account_email, u.is_active AS account_active FROM drivers t LEFT JOIN vehicles v ON v.id = t.vehicle_id LEFT JOIN users u ON u.id = t.user_id',
  orderBy: 't.name ASC',
});

export const Pricing = createCrud({
  table: 'pricing',
  fields: ['service_id', 'name', 'base_price', 'price_per_km', 'minimum_price', 'additional_fees', 'currency', 'notes', 'is_active'],
  selectSql: 'SELECT t.*, s.name AS service_name FROM pricing t LEFT JOIN services s ON s.id = t.service_id',
  orderBy: 't.id ASC',
});

export const Testimonials = createCrud({
  table: 'testimonials',
  fields: ['customer_name', 'customer_photo_url', 'text', 'rating', 'status'],
  orderBy: 't.created_at DESC',
});
