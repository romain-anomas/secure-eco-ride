import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowUpRight, CalendarDays, CarFront, CheckCircle2, Clock3, MessageSquareText, Users, UserRoundCheck, XCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Spinner } from '../../components/admin/ui.jsx';
import { STATUS_LABELS, formatDate, formatTime } from '../../utils/format.js';
import { parseError } from '../../services/api.js';

const COLORS = ['#f59e0b', '#0ea5e9', '#6366f1', '#8b5cf6', '#14b8a6', '#16a34a', '#ef4444'];
const dateValue = (value) => value == null ? 0 : Number(value);

function Metric({ icon: Icon, label, value, hint, color, to }) {
  const content = <div className="flex h-full items-center gap-3 rounded-2xl border border-night/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ color, backgroundColor: `${color}14` }}><Icon size={20} /></span>
    <div className="min-w-0"><p className="text-2xl font-extrabold leading-none tracking-tight">{value ?? '—'}</p><p className="mt-1 text-xs font-semibold text-night/55">{label}</p>{hint && <p className="mt-1 truncate text-[11px] text-night/40">{hint}</p>}</div>
  </div>;
  return to ? <Link to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">{content}</Link> : content;
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={`rounded-2xl border border-night/10 bg-white p-5 shadow-sm ${className}`}><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-night/50">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function StatusChart({ statuses }) {
  const rows = Object.entries(statuses || {}).filter(([, n]) => dateValue(n) > 0);
  const total = rows.reduce((sum, [, n]) => sum + dateValue(n), 0);
  if (!total) return <Empty>No bookings yet.</Empty>;
  let offset = 0;
  const stops = rows.map(([, count], i) => { const start = offset; offset += dateValue(count) / total * 100; return `${COLORS[i % COLORS.length]} ${start}% ${offset}%`; }).join(', ');
  return <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around"><div className="relative grid h-40 w-40 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={`${total} bookings by status`}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner"><div><p className="text-2xl font-extrabold">{total}</p><p className="text-[10px] text-night/50">bookings</p></div></div></div><ul className="w-full space-y-2">{rows.map(([status, count], i) => <li key={status} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{STATUS_LABELS[status] || status}</span><span className="font-bold">{count}<span className="ml-1 text-xs font-normal text-night/45">{Math.round(dateValue(count) / total * 100)}%</span></span></li>)}</ul></div>;
}

function BookingTrend({ rows }) {
  if (!rows?.length) return <Empty>No booking activity for this period.</Empty>;
  const max = Math.max(...rows.map((row) => dateValue(row.bookings)), 1);
  return <div className="overflow-x-auto"><div className="flex h-48 min-w-[520px] items-end gap-2 border-b border-l border-night/10 px-2 pb-1" role="img" aria-label="Bookings per day over the last 30 days">{rows.map((row) => { const value = dateValue(row.bookings); return <div key={row.day} title={`${formatDate(row.day)}: ${value} bookings`} className="group flex h-full min-w-3 flex-1 flex-col items-center justify-end"><div className="mb-1 text-[10px] font-semibold text-night/50 opacity-0 group-hover:opacity-100">{value}</div><div className="w-full max-w-8 rounded-t-md bg-amber-400 transition group-hover:bg-amber-500" style={{ height: `${Math.max(value ? 5 : 0, value / max * 145)}px` }} /><span className="mt-2 text-[9px] text-night/45">{row.day.slice(8)}</span></div>; })}</div><div className="mt-2 flex justify-between text-[10px] text-night/45"><span>Last 30 days</span><span>Pickup date</span></div></div>;
}

function ServiceMix({ rows }) {
  if (!rows?.length) return <Empty>No service bookings in this period.</Empty>;
  const max = Math.max(...rows.map((row) => dateValue(row.value)), 1);
  const total = rows.reduce((sum, row) => sum + dateValue(row.value), 0);
  return <div className="space-y-4">{rows.slice(0, 5).map((row, i) => <div key={row.label}><div className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold">{row.label}</span><span className="shrink-0 font-bold">{row.value} <span className="font-normal text-night/45">· {Math.round(dateValue(row.value) / total * 100)}%</span></span></div><div className="h-2.5 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full transition-all" style={{ width: `${dateValue(row.value) / max * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div></div>)}</div>;
}

function RouteLeaders({ rows }) {
  if (!rows?.length) return <Empty>No popular routes yet.</Empty>;
  const max = Math.max(...rows.map((row) => dateValue(row.trips)), 1);
  return <ol className="space-y-3">{rows.slice(0, 5).map((row, i) => <li key={`${row.pickup_location}-${row.destination}`} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mist text-xs font-extrabold text-night/60">{String(i + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold" title={`${row.pickup_location} → ${row.destination}`}>{row.pickup_location} <span className="text-night/40">→</span> {row.destination}</span><span className="shrink-0 font-bold">{row.trips}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-night/70" style={{ width: `${dateValue(row.trips) / max * 100}%` }} /></div></div></li>)}</ol>;
}

export default function Dashboard() {
  const summary = useFetch('/dashboard/summary');
  const pending = useFetch('/bookings', { params: { status: 'PENDING', limit: 6 }, initial: [] });
  const reports = useFetch('/reports');
  const s = summary.data;

  return <div className="mx-auto max-w-[1500px] space-y-5">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-moss">Operations overview</p><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1><p className="mt-1 text-sm text-night/55">Your ride activity and team readiness at a glance.</p></div><div className="flex flex-wrap gap-2"><Link to="/admin/bookings" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-night transition hover:bg-amber-300">View bookings <ArrowUpRight size={16} /></Link><Link to="/admin/reports" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-night/15 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-amber-400 hover:bg-amber-50">Reports</Link></div></div>
    <ErrorBox>{summary.error && parseError(summary.error).message}</ErrorBox>
    {s?.whatsapp_failed_7d > 0 && <Link to="/admin/whatsapp" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><AlertTriangle size={18} />{s.whatsapp_failed_7d} WhatsApp notification{s.whatsapp_failed_7d === 1 ? '' : 's'} failed in the last 7 days. Review logs <ArrowUpRight size={16} /></Link>}
    {summary.loading && !s ? <Spinner /> : s && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
        <Metric icon={CalendarDays} label="Rides today" value={s.today} color="#d97706" to="/admin/bookings" />
        <Metric icon={Clock3} label="Awaiting review" value={s.pending} hint={s.unseen_bookings ? `${s.unseen_bookings} new and unseen` : 'Pending bookings'} color="#d97706" to="/admin/bookings" />
        <Metric icon={CheckCircle2} label="Confirmed rides" value={s.confirmed} color="#0284c7" to="/admin/bookings" />
        <Metric icon={Users} label="Customers" value={s.customers} color="#7c3aed" to="/admin/customers" />
        <Metric icon={UserRoundCheck} label="Active drivers" value={s.active_drivers} color="#0f766e" to="/admin/drivers" />
        <Metric icon={CarFront} label="Available vehicles" value={s.available_vehicles} color="#475569" to="/admin/vehicles" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Booking activity" subtitle="Daily bookings over the last 30 days" action={<span className="rounded-lg bg-mist px-2.5 py-1 text-[11px] font-bold text-night/60">30 DAYS</span>} className="xl:col-span-2">{reports.loading && !reports.data ? <Spinner /> : <BookingTrend rows={reports.data?.per_day} />}</Panel>
        <Panel title="Bookings by status" subtitle="Current booking pipeline"><StatusChart statuses={s.by_status} /></Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Service demand" subtitle="Most requested services · last 30 days" action={<span className="text-[10px] font-bold uppercase tracking-wider text-night/40">Top 5</span>}>
          {reports.loading && !reports.data ? <Spinner /> : <ServiceMix rows={reports.data?.per_service} />}
        </Panel>
        <Panel title="Popular routes" subtitle="Routes with the most bookings · last 30 days" action={<span className="text-[10px] font-bold uppercase tracking-wider text-night/40">Top 5</span>}>
          {reports.loading && !reports.data ? <Spinner /> : <RouteLeaders rows={reports.data?.top_routes} />}
        </Panel>
        <Panel title="Ride outcomes" subtitle="Completed and cancelled rides"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-green-50 p-4"><p className="text-xs font-semibold text-green-800">COMPLETED</p><p className="mt-2 text-3xl font-extrabold text-green-900">{s.completed}</p><p className="mt-1 text-[11px] text-green-800/70">rides finished</p></div><div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-semibold text-red-800">CANCELLED</p><p className="mt-2 text-3xl font-extrabold text-red-900">{s.cancelled}</p><p className="mt-1 text-[11px] text-red-800/70">rides cancelled</p></div></div><div className="mt-4"><Link to="/admin/reports" className="inline-flex items-center gap-1 text-xs font-bold text-moss hover:underline">Explore full reports <ArrowUpRight size={14} /></Link></div></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Needs confirmation" subtitle="Review new ride requests" action={<Link to="/admin/bookings" className="text-xs font-bold text-moss hover:underline">All bookings →</Link>} className="xl:col-span-2">
          {pending.loading && !pending.data?.length ? <Spinner /> : !pending.data?.length ? <Empty>Nothing waiting for confirmation.</Empty> : <>
            <ul className="space-y-3 md:hidden">{pending.data.map((b) => <li key={b.id} className="rounded-xl border border-night/10 bg-[#fcfdfc] p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link to={`/admin/bookings/${b.id}`} className="font-bold text-night hover:text-moss">{b.reference}</Link><p className="mt-0.5 truncate text-sm text-night/60">{b.customer_name}</p></div><Badge value={b.status} /></div><div className="mt-3 grid grid-cols-2 gap-3 border-t border-night/10 pt-3 text-xs"><div><p className="text-night/45">Pickup time</p><p className="mt-0.5 font-semibold">{formatDate(b.pickup_date)} · {formatTime(b.pickup_time)}</p></div><div className="min-w-0"><p className="text-night/45">Route</p><p className="mt-0.5 truncate font-semibold" title={`${b.pickup_location} to ${b.destination}`}>{b.pickup_location} → {b.destination}</p></div></div><Link to={`/admin/bookings/${b.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700">Review booking <ArrowUpRight size={14} /></Link></li>)}</ul>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[580px] text-left"><thead><tr className="border-b border-night/10 text-[10px] uppercase tracking-wider text-night/45"><th className="pb-2 font-bold">Booking / customer</th><th className="pb-2 font-bold">Pickup</th><th className="pb-2 font-bold">Route</th><th className="pb-2 font-bold">Status</th></tr></thead><tbody className="divide-y divide-night/5">{pending.data.map((b) => <tr key={b.id} className="text-xs"><td className="py-3 pr-3"><Link to={`/admin/bookings/${b.id}`} className="font-bold text-night hover:text-moss">{b.reference}</Link><p className="mt-0.5 text-night/55">{b.customer_name}</p></td><td className="py-3 pr-3 whitespace-nowrap">{formatDate(b.pickup_date)}<p className="mt-0.5 text-night/50">{formatTime(b.pickup_time)}</p></td><td className="max-w-56 py-3 pr-3"><p className="truncate">{b.pickup_location}</p><p className="truncate text-night/50">to {b.destination}</p></td><td className="py-3"><Badge value={b.status} /></td></tr>)}</tbody></table></div>
          </>}
        </Panel>
        <Panel title="Operations pulse" subtitle="Other items to keep an eye on"><ul className="divide-y divide-night/10">{[[MessageSquareText, 'New contact messages', s.new_messages, '/admin/messages', '#0ea5e9'], [Activity, 'Completed rides', s.completed, '/admin/bookings', '#16a34a'], [XCircle, 'Cancelled rides', s.cancelled, '/admin/bookings', '#ef4444']].map(([Icon, label, value, to, color]) => <li key={label} className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2.5 text-sm"><Icon size={17} style={{ color }} />{label}</span><Link to={to} className="rounded-lg bg-mist px-2.5 py-1 text-sm font-extrabold hover:bg-leaf">{value ?? 0}</Link></li>)}</ul><Link to="/admin/reports" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-moss hover:underline">Open reports <ArrowUpRight size={14} /></Link></Panel>
      </div>
    </>}
  </div>;
}
