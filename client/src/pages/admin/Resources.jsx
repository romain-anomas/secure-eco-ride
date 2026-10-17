import ResourceManager from '../../components/admin/ResourceManager.jsx';
import { Badge } from '../../components/admin/ui.jsx';
import { ICON_OPTIONS } from '../../components/ServiceIcon.jsx';
import { prettyPhone } from '../../utils/phone.js';
import { formatDateTime, money } from '../../utils/format.js';
import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Modal } from '../../components/admin/ui.jsx';
import { parseError, patch, post } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const opt = (arr) => arr.map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' ') }));
const yesNo = (v) => (v ? 'Yes' : 'No');

// ------------------------------------------------------------------ Drivers
const DRIVER_FIELDS = [
  { name: 'name', label: 'Full name', required: true },
  { name: 'phone', label: 'Phone', type: 'phone', required: true, hint: 'Choose the calling code, then enter the number.' },
  { name: 'license_number', label: 'License number', hint: 'Only if you are legally required and permitted to keep it.' },
  { name: 'status', label: 'Status', type: 'select', options: opt(['AVAILABLE', 'BUSY', 'OFFLINE']), allowEmpty: false, default: 'AVAILABLE' },
  { name: 'vehicle_id', label: 'Assigned vehicle', type: 'select', numeric: true, optionsFrom: { endpoint: '/fleet', params: { all: 1 }, label: (v) => `${v.name}${v.plate_number ? ` · ${v.plate_number}` : ''}` } },
  { name: 'is_active', label: 'Active driver', type: 'checkbox', hint: 'Inactive drivers cannot be assigned to bookings.' },
];
export const Drivers = () => {
  const { isAdmin } = useAuth();
  return <ResourceManager title="Drivers" subtitle="Add your real drivers and create their sign-in accounts." endpoint="/drivers" itemName="driver" addLabel="Add driver" empty="No drivers yet. Add your first driver."
    fields={DRIVER_FIELDS}
    columns={[
      { header: 'Name', render: (r) => <span className="font-semibold">{r.name}</span> },
      { header: 'Phone', render: (r) => prettyPhone(r.phone) },
      { header: 'Status', render: (r) => <Badge value={r.status} /> },
      { header: 'Vehicle', render: (r) => r.vehicle_name ? `${r.vehicle_name}${r.vehicle_plate ? ` (${r.vehicle_plate})` : ''}` : '—' },
      { header: 'Active', render: (r) => yesNo(r.is_active) },
      { header: 'Driver login', render: (r) => r.account_email || 'Not created' },
    ]} renderRowAction={isAdmin ? (row, actions) => <DriverAccountAction key={row.id} row={row} {...actions} /> : undefined} />;
};

function DriverAccountAction({ row, reload, setNotice, setActionError }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountActive, setAccountActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const hasAccount = Boolean(row.account_email);
  function openEditor() {
    setEmail(row.account_email || '');
    setPassword('');
    setAccountActive(row.account_active !== false && row.account_active !== 0);
    setShowPassword(false);
    setCreated(null);
    setOpen(true);
  }
  function closeEditor() { setOpen(false); setCreated(null); setPassword(''); }
  async function submit(e) {
    e.preventDefault(); setBusy(true); setActionError('');
    try {
      if (hasAccount) {
        const payload = { email, is_active: accountActive };
        if (password) payload.password = password;
        await patch(`/drivers/${row.id}/account`, payload);
        setNotice(`Driver login updated for ${row.name}.`);
        closeEditor();
      } else {
        const result = await post(`/drivers/${row.id}/account`, { email, password });
        setCreated(result.data); setNotice(`Driver login created for ${row.name}.`);
      }
      reload();
    } catch (err) { setActionError(parseError(err).message); }
    finally { setBusy(false); }
  }
  return <>
    <button type="button" title={hasAccount ? 'Manage driver login' : 'Create driver login'} className="grid h-9 w-9 place-items-center rounded-full border border-night/15 hover:border-leaf" onClick={openEditor} aria-label={`${hasAccount ? 'Manage' : 'Create'} login for ${row.name}`}><KeyRound className="h-4 w-4" /></button>
    {open && <Modal title={`${hasAccount ? 'Manage' : 'Create'} login for ${row.name}`} onClose={closeEditor}>
      {created ? <div className="space-y-4 text-sm">
        <p className="rounded-xl bg-leaf/10 p-3 font-medium">Share these sign-in details securely with the driver.</p>
        <div className="space-y-2 rounded-xl border border-night/10 p-4"><p className="break-all"><b>Email:</b> {created.email}</p><p className="break-all"><b>Temporary password:</b> {password}</p></div>
        <p className="text-night/60">The driver can change this password after signing in.</p>
        <div className="flex justify-end"><button type="button" className="btn btn-primary btn-sm" onClick={closeEditor}>Done</button></div>
      </div> : <form onSubmit={submit} className="space-y-5">
        <p className="rounded-xl bg-mist px-4 py-3 text-sm leading-relaxed text-night/70">This account only gives the driver access to assigned jobs and availability.</p>
        <label className="block text-left"><span className="label text-left">Login email</span><input className="input text-left" type="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block"><span className="label">{hasAccount ? 'New password (optional)' : 'Temporary password'}</span><span className="relative block"><input className="input pr-12" type={showPassword ? 'text' : 'password'} minLength={hasAccount && !password ? undefined : 10} required={!hasAccount} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder={hasAccount ? 'Leave blank to keep current password' : 'At least 10 characters'} /><button type="button" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-night/55 hover:bg-mist" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span><span className="mt-1 block text-xs text-night/55">{hasAccount ? 'Enter at least 10 characters only when changing it.' : 'At least 10 characters.'}</span></label>
        {hasAccount && <label className="flex items-center gap-3 rounded-xl border border-night/15 px-4 py-3"><input type="checkbox" className="h-5 w-5 accent-[rgb(var(--c-green))]" checked={accountActive} onChange={(e) => setAccountActive(e.target.checked)} /><span><span className="block text-sm font-semibold">Allow driver sign-in</span><span className="block text-xs text-night/55">Turn off to block this login account.</span></span></label>}
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-outline btn-sm" onClick={closeEditor}>Cancel</button><button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : hasAccount ? 'Save account' : 'Create account'}</button></div>
      </form>}
    </Modal>}
  </>;
}

// ----------------------------------------------------------------- Vehicles
const VEHICLE_FIELDS = [
  { name: 'name', label: 'Vehicle name', required: true },
  { name: 'model', label: 'Model' },
  { name: 'plate_number', label: 'Plate number', hint: 'Never shown publicly.' },
  { name: 'category', label: 'Category', required: true, default: 'Sedan', hint: 'e.g. Sedan, SUV, Executive, Airport Vehicle' },
  { name: 'capacity', label: 'Passenger capacity', type: 'number', min: 1, max: 60, required: true, default: 4 },
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
  { name: 'sort_order', label: 'Sort order', type: 'number', min: -1000, max: 1000, required: true, default: 0 },
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
  { name: 'base_price', label: 'Base price', type: 'money', max: 1000000000 },
  { name: 'price_per_km', label: 'Price per km', type: 'money', max: 1000000000 },
  { name: 'minimum_price', label: 'Minimum price', type: 'money', max: 1000000000 },
  { name: 'additional_fees', label: 'Additional fees', type: 'money', max: 1000000000 },
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
  { name: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, max: 5, required: true, default: 5 },
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
