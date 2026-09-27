import ResourceManager from '../../components/admin/ResourceManager.jsx';
import { Badge } from '../../components/admin/ui.jsx';
import { ICON_OPTIONS } from '../../components/ServiceIcon.jsx';
import { prettyPhone } from '../../utils/phone.js';
import { formatDateTime, money } from '../../utils/format.js';

const opt = (arr) => arr.map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') }));
const yesNo = (v) => (v ? 'Yes' : 'No');

// ------------------------------------------------------------------ Drivers
const DRIVER_FIELDS = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true, hint: 'e.g. 0788123456' },
  { name: 'license_number', label: 'License number', hint: 'Only if you are legally required and permitted to keep it.' },
  { name: 'status', label: 'Status', type: 'select', options: opt(['AVAILABLE', 'BUSY', 'OFFLINE']), allowEmpty: false, default: 'AVAILABLE' },
  { name: 'vehicle_id', label: 'Assigned vehicle', type: 'select', numeric: true, optionsFrom: { endpoint: '/fleet', params: { all: 1 }, label: (v) => `${v.name}${v.plate_number ? ` · ${v.plate_number}` : ''}` } },
  { name: 'is_active', label: 'Active driver', type: 'checkbox', hint: 'Inactive drivers cannot be assigned to bookings.' },
];
export const Drivers = () => (
  <ResourceManager title="Drivers" subtitle="Add your real drivers. Nothing is pre-filled." endpoint="/drivers" itemName="driver" addLabel="Add driver" empty="No drivers yet. Add your first driver."
    fields={DRIVER_FIELDS}
    columns={[
      { header: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
      { header: 'Phone', render: (r) => prettyPhone(r.phone) },
      { header: 'Status', render: (r) => <Badge value={r.status} /> },
      { header: 'Vehicle', render: (r) => r.vehicle_name ? `${r.vehicle_name}${r.vehicle_plate ? ` (${r.vehicle_plate})` : ''}` : '—' },
      { header: 'Active', render: (r) => yesNo(r.is_active) },
    ]} />
);

// ----------------------------------------------------------------- Vehicles
const VEHICLE_FIELDS = [
  { name: 'name', label: 'Vehicle name', required: true },
  { name: 'model', label: 'Model' },
  { name: 'plate_number', label: 'Plate number', hint: 'Never shown publicly.' },
  { name: 'category', label: 'Category', required: true, default: 'Sedan', hint: 'e.g. Sedan, SUV, Executive, Airport Vehicle' },
  { name: 'capacity', label: 'Passenger capacity', type: 'number', default: 4 },
  { name: 'status', label: 'Status', type: 'select', options: opt(['AVAILABLE', 'BUSY', 'MAINTENANCE']), allowEmpty: false, default: 'AVAILABLE' },
  { name: 'image_url', label: 'Photo', type: 'image' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'features', label: 'Features', type: 'features' },
  { name: 'is_public', label: 'Show on website', type: 'checkbox', hint: 'Only list vehicles the company really operates.' },
];
export const Vehicles = () => (
  <ResourceManager title="Vehicles" subtitle="What you list here appears on the public Fleet page." endpoint="/fleet" listParams={{ all: 1 }} itemName="vehicle" addLabel="Add vehicle" empty="No vehicles yet. Add the vehicles you actually own."
    fields={VEHICLE_FIELDS}
    columns={[
      { header: 'Vehicle', render: (r) => <div><span className="font-semibold">{r.name}</span>{r.model && <span className="block text-xs text-night/55">{r.model}</span>}</div> },
      { header: 'Plate', render: (r) => r.plate_number || '—' },
      { header: 'Category', render: (r) => r.category },
      { header: 'Seats', render: (r) => r.capacity },
      { header: 'Status', render: (r) => <Badge value={r.status} /> },
      { header: 'Public', render: (r) => yesNo(r.is_public) },
    ]} />
);

// ----------------------------------------------------------------- Services
const SERVICE_FIELDS = [
  { name: 'name', label: 'Service name', required: true },
  { name: 'slug', label: 'URL name (slug)', hint: 'Leave blank to generate from the name.' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS.map((v) => ({ value: v, label: v })), allowEmpty: false, default: 'car' },
  { name: 'sort_order', label: 'Sort order', type: 'number', default: 0 },
  { name: 'is_bookable', label: 'Selectable in booking form', type: 'checkbox' },
  { name: 'is_active', label: 'Visible on website', type: 'checkbox' },
];
export const ServicesAdmin = () => (
  <ResourceManager title="Services" subtitle="Control what customers see and can book." endpoint="/services" listParams={{ all: 1 }} itemName="service" addLabel="Add service" empty="No services yet."
    fields={SERVICE_FIELDS}
    columns={[
      { header: 'Order', render: (r) => r.sort_order },
      { header: 'Service', render: (r) => <span className="font-semibold">{r.name}</span> },
      { header: 'Bookable', render: (r) => yesNo(r.is_bookable) },
      { header: 'Visible', render: (r) => yesNo(r.is_active) },
    ]} />
);

// ------------------------------------------------------------------ Pricing
const PRICING_FIELDS = [
  { name: 'name', label: 'Rule name', required: true, hint: 'e.g. Standard city ride' },
  { name: 'service_id', label: 'Service', type: 'select', numeric: true, optionsFrom: { endpoint: '/services', params: { all: 1 }, label: (s) => s.name } },
  { name: 'base_price', label: 'Base price', type: 'money' },
  { name: 'price_per_km', label: 'Price per km', type: 'money' },
  { name: 'minimum_price', label: 'Minimum price', type: 'money' },
  { name: 'additional_fees', label: 'Additional fees', type: 'money' },
  { name: 'currency', label: 'Currency', default: 'RWF' },
  { name: 'notes', label: 'Note shown with the price', hint: 'e.g. "per trip within the city"' },
  { name: 'is_active', label: 'Active', type: 'checkbox' },
];
export const PricingAdmin = () => (
  <ResourceManager title="Pricing" subtitle="Optional. Prices appear on the website only when 'Show prices' is switched on in Settings; otherwise rides are quoted on request." endpoint="/pricing" itemName="pricing rule" addLabel="Add rule" empty="No pricing rules. That is fine — bookings will be quotation-based."
    fields={PRICING_FIELDS}
    columns={[
      { header: 'Rule', render: (r) => <span className="font-semibold">{r.name}</span> },
      { header: 'Service', render: (r) => r.service_name || 'All' },
      { header: 'Base', render: (r) => money(r.base_price, r.currency) },
      { header: 'Per km', render: (r) => money(r.price_per_km, r.currency) },
      { header: 'Minimum', render: (r) => money(r.minimum_price, r.currency) },
      { header: 'Fees', render: (r) => money(r.additional_fees, r.currency) },
      { header: 'Active', render: (r) => yesNo(r.is_active) },
    ]} />
);

// ------------------------------------------------------------ Testimonials
const TESTIMONIAL_FIELDS = [
  { name: 'customer_name', label: 'Customer name', required: true },
  { name: 'text', label: 'Testimonial', type: 'textarea', required: true, hint: 'Only add feedback from real customers, with their permission.' },
  { name: 'rating', label: 'Rating (1–5)', type: 'number', default: 5 },
  { name: 'status', label: 'Status', type: 'select', options: opt(['PENDING', 'APPROVED', 'HIDDEN']), allowEmpty: false, default: 'PENDING', hint: 'Only APPROVED testimonials appear publicly.' },
];
export const TestimonialsAdmin = () => (
  <ResourceManager title="Testimonials" subtitle="Only approved testimonials appear on the website." endpoint="/testimonials" listParams={{ all: 1 }} itemName="testimonial" addLabel="Add testimonial" empty="No testimonials yet."
    fields={TESTIMONIAL_FIELDS}
    columns={[
      { header: 'Customer', render: (r) => <span className="font-semibold">{r.customer_name}</span> },
      { header: 'Rating', render: (r) => `${r.rating} / 5` },
      { header: 'Text', render: (r) => <span className="line-clamp-2 max-w-md">{r.text}</span> },
      { header: 'Status', render: (r) => <Badge value={r.status} /> },
      { header: 'Added', render: (r) => formatDateTime(r.created_at) },
    ]} />
);

// -------------------------------------------------------------------- Users
const USER_FIELDS = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email (login)', type: 'email', required: true },
  { name: 'password', label: 'Password', type: 'password', hint: 'At least 10 characters. When editing, leave blank to keep the current one.' },
  { name: 'role', label: 'Role', type: 'select', options: opt(['STAFF', 'ADMIN']), allowEmpty: false, default: 'STAFF', hint: 'Staff manage bookings, drivers and messages. Admins can change everything.' },
  { name: 'is_active', label: 'Account active', type: 'checkbox' },
];
export const UsersAdmin = () => (
  <ResourceManager title="Team accounts" subtitle="People who can sign in to this dashboard." endpoint="/users" itemName="account" addLabel="Add account" empty="No accounts."
    fields={USER_FIELDS}
    columns={[
      { header: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
      { header: 'Email', render: (r) => r.email },
      { header: 'Role', render: (r) => <Badge value={r.role} /> },
      { header: 'Active', render: (r) => yesNo(r.is_active) },
      { header: 'Last sign-in', render: (r) => (r.last_login_at ? formatDateTime(r.last_login_at) : 'Never') },
    ]} />
);
