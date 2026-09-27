import { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Empty, ErrorBox, PageHeader, Spinner } from '../../components/admin/ui.jsx';
import { STATUS_LABELS, formatDate, money } from '../../utils/format.js';
import { parseError } from '../../services/api.js';

/** Lightweight horizontal bar list — no chart library needed. */
export function HBars({ rows, empty = 'No data for this period.' }) {
  if (!rows?.length) return <p className="text-sm text-night/55">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm"><span className="font-semibold">{r.label}</span><span className="text-night/60">{r.value}</span></div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-leaf" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function DayBars({ rows }) {
  if (!rows.length) return <p className="text-sm text-night/55">No bookings in this period.</p>;
  const max = Math.max(...rows.map((r) => r.bookings), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex h-44 min-w-max items-end gap-1.5" role="img" aria-label="Bookings per day">
        {rows.map((r) => (
          <div key={r.day} className="group flex w-7 flex-col items-center justify-end" title={`${formatDate(r.day)}: ${r.bookings}`}>
            <span className="mb-1 text-[10px] font-bold text-night/60">{r.bookings}</span>
            <div className="w-full rounded-t bg-leaf transition group-hover:bg-lime" style={{ height: `${Math.max(6, (r.bookings / max) * 130)}px` }} />
            <span className="mt-1 text-[10px] text-night/50">{r.day.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  const [range, setRange] = useState({ from: '', to: '' });
  const params = Object.fromEntries(Object.entries(range).filter(([, v]) => v));
  const { data: d, loading, error } = useFetch('/reports', { params });

  return (
    <>
      <PageHeader title="Reports" subtitle={d ? `${formatDate(d.from)} – ${formatDate(d.to)} (by pickup date)` : 'Last 30 days by default'} />
      <div className="admin-card mb-6 grid max-w-xl gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="r-from">From</label><input id="r-from" type="date" className="input" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></div>
        <div><label className="label" htmlFor="r-to">To</label><input id="r-to" type="date" className="input" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></div>
      </div>
      <ErrorBox>{error && parseError(error).message}</ErrorBox>
      {loading && !d ? <Spinner /> : d && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[['Bookings', d.totals.total], ['Completed', d.totals.completed], ['Cancelled', d.totals.cancelled], ['Unique customers', d.totals.unique_customers]].map(([k, v]) => (
              <div key={k} className="admin-card"><p className="font-display text-3xl font-black">{v ?? 0}</p><p className="text-sm text-night/60">{k}</p></div>
            ))}
          </div>
          {d.totals.quoted_revenue != null && <p className="mt-3 text-sm text-night/60">Quoted value of completed rides: <strong>{money(d.totals.quoted_revenue)}</strong> (from the quoted prices you entered)</p>}
          <section className="admin-card mt-6"><h2 className="font-display text-lg font-black uppercase">Bookings per day</h2><div className="mt-4"><DayBars rows={d.per_day} /></div></section>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="admin-card"><h2 className="font-display text-lg font-black uppercase">By service</h2><div className="mt-4"><HBars rows={d.per_service} /></div></section>
            <section className="admin-card"><h2 className="font-display text-lg font-black uppercase">By status</h2><div className="mt-4"><HBars rows={d.per_status.map((r) => ({ ...r, label: STATUS_LABELS[r.label] || r.label }))} /></div></section>
          </div>
          <section className="admin-card mt-6">
            <h2 className="font-display text-lg font-black uppercase">Most requested routes</h2>
            {d.top_routes.length ? <ol className="mt-3 divide-y divide-night/10 text-sm">{d.top_routes.map((r, i) => <li key={i} className="flex justify-between gap-4 py-2.5"><span>{r.pickup_location} → {r.destination}</span><span className="font-bold">{r.trips}×</span></li>)}</ol> : <div className="mt-3"><Empty>No routes yet.</Empty></div>}
          </section>
        </>
      )}
    </>
  );
}
