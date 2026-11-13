import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Spinner } from '../../components/admin/ui.jsx';
import { STATUS_LABELS, formatDate, formatTime } from '../../utils/format.js';
import { parseError } from '../../services/api.js';

const CHART_COLORS = ['#188355', '#0284c7', '#d97706', '#7c3aed', '#0f766e', '#dc5b45', '#64748b'];
const dateValue = (value) => value == null ? 0 : Number(value);
const formatCount = (value) => Number(value ?? 0).toLocaleString();

function Metric({ icon: Icon, label, value, hint, to }) {
  const content = (
    <div className="flex h-full min-h-28 items-start gap-3 rounded-2xl border border-night/10 bg-white p-4 shadow-sm transition hover:border-leaf/35 hover:shadow-md sm:p-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf/10 text-moss">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tracking-tight tabular-nums">{formatCount(value)}</p>
        <p className="mt-2 text-xs font-semibold text-night/60 sm:text-sm">{label}</p>
        {hint && <p className="mt-1 truncate text-xs text-night/45">{hint}</p>}
      </div>
      {to && <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-night/30" aria-hidden="true" />}
    </div>
  );
  return to
    ? <Link to={to} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf">{content}</Link>
    : content;
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-night/10 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-night/55 sm:text-sm">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusChart({ statuses }) {
  const rows = Object.entries(statuses || {}).filter(([, count]) => dateValue(count) > 0);
  const total = rows.reduce((sum, [, count]) => sum + dateValue(count), 0);

  if (!total) return <Empty>No bookings to summarize yet.</Empty>;

  let offset = 0;
  const stops = rows.map(([, count], index) => {
    const start = offset;
    offset += dateValue(count) / total * 100;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${offset}%`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div
        className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full sm:h-40 sm:w-40"
        style={{ background: `conic-gradient(${stops})` }}
        role="img"
        aria-label={`${formatCount(total)} bookings by status`}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner">
          <div>
            <p className="text-2xl font-bold tabular-nums">{formatCount(total)}</p>
            <p className="text-[11px] text-night/50">all bookings</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {rows.map(([status, count], index) => (
          <li key={status} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} aria-hidden="true" />
              <span className="truncate">{STATUS_LABELS[status] || status.replace(/_/g, ' ')}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">
              {formatCount(count)} <span className="text-xs font-normal text-night/45">{Math.round(dateValue(count) / total * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookingTrend({ rows, from, to }) {
  if (!rows) return <Empty>No booking activity for this period.</Empty>;

  const byDay = new Map(rows.map((row) => [row.day, dateValue(row.bookings)]));
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const days = [];

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const day = cursor.toISOString().slice(0, 10);
      days.push({ day, bookings: byDay.get(day) || 0 });
    }
  } else {
    days.push(...rows);
  }

  if (!days.length) return <Empty>No booking activity for this period.</Empty>;

  const max = Math.max(...days.map((day) => dateValue(day.bookings)), 1);
  const total = days.reduce((sum, day) => sum + dateValue(day.bookings), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight tabular-nums">{formatCount(total)} <span className="text-sm font-medium text-night/50">bookings</span></p>
        <p className="text-xs text-night/50">By pickup date</p>
      </div>
      <div
        className="grid h-40 items-end gap-1 border-b border-l border-night/10 px-2 pb-1 sm:h-48 sm:gap-1.5"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`Daily bookings from ${formatDate(from)} to ${formatDate(to)}`}
      >
        {days.map((day, index) => {
          const value = dateValue(day.bookings);
          const showLabel = index === 0 || index === days.length - 1 || index % 5 === 0;
          return (
            <div key={day.day} title={`${formatDate(day.day)}: ${formatCount(value)} bookings`} className="group flex h-full min-w-0 flex-col items-center justify-end">
              <div
                className={`w-full max-w-8 rounded-t-sm transition-colors group-hover:bg-lime ${value ? 'bg-leaf' : 'bg-night/10'}`}
                style={{ height: `${value ? Math.max(4, value / max * 145) : 2}px` }}
                aria-hidden="true"
              />
              <span className={`mt-2 h-3 text-[9px] text-night/45 sm:text-[10px] ${showLabel ? '' : 'invisible'}`}>
                {day.day.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-night/45">
        <span>{formatDate(from)}</span>
        <span>{formatDate(to)}</span>
      </div>
    </div>
  );
}

function PendingBookings({ data, loading, error }) {
  return (
    <Panel
      title="Bookings to review"
      subtitle="Pending ride requests that need attention"
      action={<Link to="/admin/bookings" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-moss hover:bg-leaf/10">All bookings <ArrowUpRight size={14} /></Link>}
    >
      <ErrorBox>{error && parseError(error).message}</ErrorBox>
      {loading && !data?.length ? <Spinner label="Loading pending bookings…" /> : error ? null : !data?.length ? (
        <Empty>You’re all caught up. No bookings are waiting for review.</Empty>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {data.map((booking) => (
              <li key={booking.id} className="rounded-xl border border-night/10 bg-mist/50 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/admin/bookings/${booking.id}`} className="font-bold text-moss hover:underline">{booking.reference}</Link>
                    <p className="mt-0.5 truncate text-sm text-night/60">{booking.customer_name}</p>
                  </div>
                  <Badge value={booking.status} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-night/10 pt-3 text-xs">
                  <div>
                    <p className="text-night/45">Pickup</p>
                    <p className="mt-0.5 font-semibold">{formatDate(booking.pickup_date)} · {formatTime(booking.pickup_time)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-night/45">Route</p>
                    <p className="mt-0.5 truncate font-semibold" title={`${booking.pickup_location} to ${booking.destination}`}>
                      {booking.pickup_location} <span className="text-night/40">→</span> {booking.destination}
                    </p>
                  </div>
                </div>
                <Link to={`/admin/bookings/${booking.id}`} className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-bold text-moss hover:underline">
                  Review request <ArrowUpRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-night/10 text-[10px] uppercase tracking-wider text-night/50">
                  <th scope="col" className="pb-3 pr-4 font-bold">Booking</th>
                  <th scope="col" className="pb-3 pr-4 font-bold">Pickup</th>
                  <th scope="col" className="pb-3 pr-4 font-bold">Route</th>
                  <th scope="col" className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night/5">
                {data.map((booking) => (
                  <tr key={booking.id} className="text-sm">
                    <td className="py-3 pr-4">
                      <Link to={`/admin/bookings/${booking.id}`} className="font-bold text-moss hover:underline">{booking.reference}</Link>
                      <p className="mt-0.5 text-xs text-night/55">{booking.customer_name}</p>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {formatDate(booking.pickup_date)}
                      <p className="mt-0.5 text-xs text-night/50">{formatTime(booking.pickup_time)}</p>
                    </td>
                    <td className="max-w-64 py-3 pr-4">
                      <p className="truncate">{booking.pickup_location}</p>
                      <p className="truncate text-xs text-night/50">to {booking.destination}</p>
                    </td>
                    <td className="py-3"><Badge value={booking.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

export default function Dashboard() {
  const summary = useFetch('/dashboard/summary');
  const pending = useFetch('/bookings', { params: { status: 'PENDING', limit: 6 }, initial: [] });
  const stats = summary.data;
  const activity = stats?.activity;

  return (
    <div className="admin-dashboard mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-night/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-moss">Operations overview</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-night/55">A clear view of today’s rides, team capacity, and requests to review.</p>
        </div>
        <Link to="/admin/bookings" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white transition hover:bg-moss sm:w-auto">
          Open bookings <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <ErrorBox>{summary.error && parseError(summary.error).message}</ErrorBox>
      {stats?.whatsapp_failed_7d > 0 && (
        <Link to="/admin/whatsapp" className="flex min-h-12 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-100">
          <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{formatCount(stats.whatsapp_failed_7d)} WhatsApp notification{stats.whatsapp_failed_7d === 1 ? '' : 's'} failed in the last 7 days.</span>
          <span className="shrink-0 text-xs font-bold">Review logs <ArrowUpRight size={14} className="inline" /></span>
        </Link>
      )}

      {summary.loading && !stats ? <Spinner label="Loading dashboard…" /> : null}
      {stats && (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
          <Metric icon={CalendarDays} label="Rides today" value={stats.today} to="/admin/bookings" />
          <Metric icon={Clock3} label="Awaiting review" value={stats.pending} hint={stats.unseen_bookings ? `${formatCount(stats.unseen_bookings)} new and unseen` : 'Pending bookings'} to="/admin/bookings" />
          <Metric icon={CheckCircle2} label="Confirmed rides" value={stats.confirmed} to="/admin/bookings" />
          <Metric icon={Users} label="Customers" value={stats.customers} to="/admin/customers" />
          <Metric icon={UserRoundCheck} label="Active drivers" value={stats.active_drivers} to="/admin/drivers" />
          <Metric icon={CarFront} label="Available vehicles" value={stats.available_vehicles} to="/admin/vehicles" />
        </section>
      )}

      <PendingBookings data={pending.data} loading={pending.loading} error={pending.error} />

      <div className="grid gap-5 xl:grid-cols-5">
        <Panel
          title="Booking activity"
          subtitle="Daily ride requests over the last 30 days"
          className="xl:col-span-3"
          action={<Link to="/admin/reports" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-moss hover:bg-leaf/10">Full report <ArrowUpRight size={14} /></Link>}
        >
          {summary.loading && !activity ? <Spinner label="Loading booking activity…" /> : activity && <BookingTrend rows={activity.per_day} from={activity.from} to={activity.to} />}
        </Panel>
        <Panel title="Booking status" subtitle="Current booking pipeline" className="xl:col-span-2">
          {summary.loading && !stats ? <Spinner label="Loading booking status…" /> : stats && <StatusChart statuses={stats.by_status} />}
        </Panel>
      </div>
    </div>
  );
}
