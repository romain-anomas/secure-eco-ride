import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, Car, UserCheck, Users, XCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, PageHeader, Spinner } from '../../components/admin/ui.jsx';
import { STATUS_LABELS, formatDate, formatTime } from '../../utils/format.js';
import { parseError } from '../../services/api.js';
import { HBars } from './Reports.jsx';

function Stat({ icon: Icon, label, value, tone = 'text-moss', to }) {
  const inner = (
    <div className="admin-card flex items-center gap-4 transition hover:border-leaf">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mist ${tone}`}><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div><p className="font-display text-3xl font-black leading-none">{value ?? '—'}</p><p className="mt-1 text-sm text-night/60">{label}</p></div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const summary = useFetch('/dashboard/summary');
  const pending = useFetch('/bookings', { params: { status: 'PENDING', limit: 8 }, initial: [] });
  const s = summary.data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="A quick look at today." />
      <ErrorBox>{summary.error && parseError(summary.error).message}</ErrorBox>
      {summary.loading && !s ? <Spinner /> : s && (
        <>
          {s.whatsapp_failed_7d > 0 && (
            <Link to="/admin/whatsapp" className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" /> {s.whatsapp_failed_7d} WhatsApp notification{s.whatsapp_failed_7d === 1 ? '' : 's'} failed in the last 7 days. Review and retry →
            </Link>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={CalendarCheck} label="Rides scheduled today" value={s.today} to="/admin/bookings" />
            <Stat icon={Clock} label="Pending bookings" value={s.pending} tone="text-amber-600" to="/admin/bookings" />
            <Stat icon={CheckCircle2} label="Confirmed bookings" value={s.confirmed} tone="text-sky-600" />
            <Stat icon={CheckCircle2} label="Completed rides" value={s.completed} />
            <Stat icon={XCircle} label="Cancelled rides" value={s.cancelled} tone="text-red-600" />
            <Stat icon={Users} label="Total customers" value={s.customers} to="/admin/customers" />
            <Stat icon={UserCheck} label="Active drivers" value={s.active_drivers} to="/admin/drivers" />
            <Stat icon={Car} label="Available vehicles" value={s.available_vehicles} to="/admin/vehicles" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="admin-card">
              <h2 className="font-display text-lg font-black uppercase">Bookings by status</h2>
              <div className="mt-4"><HBars rows={Object.entries(s.by_status).map(([k, v]) => ({ label: STATUS_LABELS[k] || k, value: v }))} empty="No bookings yet." /></div>
            </section>
            <section className="admin-card">
              <div className="flex items-center justify-between"><h2 className="font-display text-lg font-black uppercase">Waiting for confirmation</h2><Link to="/admin/bookings" className="text-sm font-bold text-moss underline">All bookings</Link></div>
              {pending.loading && !pending.data?.length ? <Spinner /> : !pending.data?.length ? <div className="mt-4"><Empty>Nothing waiting. </Empty></div> : (
                <ul className="mt-3 divide-y divide-night/10">
                  {pending.data.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div><p className="font-bold">{b.reference} · {b.customer_name}</p><p className="text-night/60">{formatDate(b.pickup_date)} {formatTime(b.pickup_time)} · {b.pickup_location} → {b.destination}</p></div>
                      <Badge value={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
