import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, RefreshCw, Search, Send } from 'lucide-react';
import { parseError, patch, post } from '../../services/api.js';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Modal, PageHeader, Pager, Spinner, TableWrap } from '../../components/admin/ui.jsx';
import { BOOKING_STATUSES, STATUS_LABELS, formatDate, formatDateTime, formatTime, money } from '../../utils/format.js';
import { prettyPhone } from '../../utils/phone.js';
import BookingLocationMap from '../../components/admin/BookingLocationMap.jsx';

const TERMINAL = ['COMPLETED', 'CANCELLED'];

export default function Bookings() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', q: '' });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(() => (routeId ? Number(routeId) : null));
  const [error, setError] = useState('');

  const params = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page, limit: 25 };
  const { data, meta: rawMeta, loading, error: loadError, reload, setData } = useFetch('/bookings', { params, initial: [] });
  const meta = rawMeta || { total: 0, limit: 25 };

  useEffect(() => { setOpenId(routeId ? Number(routeId) : null); }, [routeId]);

  function closeDetail() {
    setOpenId(null);
    if (routeId) navigate('/admin/bookings', { replace: true });
  }

  // refresh every 30 s so new website bookings show up without reloading
  useEffect(() => {
    const t = setInterval(() => { reload(); }, 30000);
    return () => clearInterval(t);
  }, [reload]);

  const setFilter = (k) => (e) => { setPage(1); setFilters((f) => ({ ...f, [k]: e.target.value })); };

  return (
    <>
      <PageHeader title="Bookings" subtitle="New website bookings appear here automatically.">
        <button type="button" className="btn btn-outline btn-sm" onClick={reload}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
      </PageHeader>

      <div className="admin-card mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" aria-hidden="true" />
          <input className="input pl-10" placeholder="Search name, phone, ID, place" aria-label="Search bookings" value={filters.q} onChange={setFilter('q')} />
        </div>
        <select className="input" aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input type="date" className="input" aria-label="Pickup date from" value={filters.date_from} onChange={setFilter('date_from')} />
        <input type="date" className="input" aria-label="Pickup date to" value={filters.date_to} onChange={setFilter('date_to')} />
      </div>

      <ErrorBox>{error || (loadError && parseError(loadError).message)}</ErrorBox>
      {loading && !data?.length ? <Spinner /> : !data?.length ? <Empty>No bookings match these filters.</Empty> : (
        <>
          <div className="space-y-3 sm:hidden">
            {data.map((b) => <article key={b.id} className={`admin-card !p-4 ${b.seen_by_admin ? '' : 'border-l-4 border-l-leaf'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-bold uppercase tracking-wide text-night/50">{b.reference}</p><h2 className="mt-1 text-lg font-bold">{b.customer_name}</h2></div>
                <Badge value={b.status} />
              </div>
              <p className="mt-2 text-sm text-night/60">{formatDate(b.pickup_date)} · {formatTime(b.pickup_time)}</p>
              <dl className="mt-3 grid gap-3 text-sm">
                <div><dt className="text-xs font-bold uppercase text-night/45">Pickup</dt><dd className="font-medium">{b.pickup_location}</dd></div>
                <div><dt className="text-xs font-bold uppercase text-night/45">Destination</dt><dd className="font-medium">{b.destination}</dd></div>
                <div className="flex items-center justify-between gap-3"><dt className="text-xs font-bold uppercase text-night/45">Driver</dt><dd>{b.driver_name || 'Not assigned'}</dd></div>
              </dl>
              <button type="button" className="btn btn-primary mt-4 w-full" onClick={() => setOpenId(b.id)}><Eye className="h-4 w-4" aria-hidden="true" /> Review booking</button>
            </article>)}
          </div>
          <div className="hidden sm:block">
          <TableWrap>
            <thead className="bg-mist">
              <tr>{['Booking ID', 'Customer', 'Phone', 'Pickup', 'Destination', 'Date', 'Time', 'Service', 'Driver', 'Status', 'Created', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-night/5">
              {data.map((b) => (
                <tr key={b.id} className={`hover:bg-mist/60 ${b.seen_by_admin ? '' : 'bg-leaf/5'}`}>
                  <td className="td whitespace-nowrap font-bold">{!b.seen_by_admin && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-leaf" title="New" />}{b.reference}</td>
                  <td className="td font-semibold">{b.customer_name}</td>
                  <td className="td whitespace-nowrap">{prettyPhone(b.customer_phone)}</td>
                  <td className="td max-w-[10rem] truncate" title={b.pickup_location}>{b.pickup_location}</td>
                  <td className="td max-w-[10rem] truncate" title={b.destination}>{b.destination}</td>
                  <td className="td whitespace-nowrap">{formatDate(b.pickup_date)}</td>
                  <td className="td">{formatTime(b.pickup_time)}</td>
                  <td className="td">{b.service_name}</td>
                  <td className="td">{b.driver_name || '—'}</td>
                  <td className="td"><Badge value={b.status} /></td>
                  <td className="td whitespace-nowrap text-night/60">{formatDateTime(b.created_at)}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" className="btn btn-primary btn-sm !px-3" onClick={() => setOpenId(b.id)}><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Review &amp; send</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          </div>
          <Pager page={page} limit={meta.limit || 25} total={meta.total || 0} onPage={setPage} />
        </>
      )}

      {openId && <BookingDetail id={openId} onClose={closeDetail} onChanged={reload} />}
    </>
  );
}

// -------------------------------------------------------------------------------------------
function Row({ k, v }) {
  return <div><dt className="text-xs font-bold uppercase tracking-wider text-night/50">{k}</dt><dd className="mt-0.5 font-semibold">{v || '—'}</dd></div>;
}

function BookingDetail({ id, onClose, onChanged }) {
  const { data: b, loading, error, reload } = useFetch(`/bookings/${id}`);
  const drivers = useFetch('/drivers', { initial: [] });
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [driverId, setDriverId] = useState('');
  const [notes, setNotes] = useState({ admin_notes: '', quoted_price: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (b) { setStatus(b.status); setDriverId(b.driver_id || ''); setNotes({ admin_notes: b.admin_notes || '', quoted_price: b.quoted_price ?? '' }); }
  }, [b?.id, b?.status, b?.driver_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(name, fn, done) {
    setBusy(name); setErr(''); setMsg('');
    try { const result = await fn(); setMsg(typeof done === 'function' ? done(result) : done); await reload(); onChanged?.(); } catch (e) { setErr(parseError(e).message); } finally { setBusy(''); }
  }

  const sendUpdate = () => run('dispatch', () => post(`/bookings/${id}/send-update`, { driver_id: Number(driverId), status, note: note || null }), (response) => {
    const emailState = response.meta?.status_emails;
    if (emailState?.customer === 'SENT' && emailState?.admin === 'SENT') return 'Booking saved. Email sent to the passenger and admin inbox.';
    if (emailState?.customer === 'NO_EMAIL') return 'Booking saved and admin emailed, but this older booking has no passenger email address.';
    if (emailState?.customer === 'FAILED' || emailState?.admin === 'FAILED') return 'Booking saved, but one or more emails failed. Check SMTP settings and server logs.';
    return 'Booking saved and email sent.';
  }).then(() => setNote(''));
  const saveNotes = () => {
    if (notes.quoted_price !== '') {
      const quote = Number(notes.quoted_price);
      if (!Number.isFinite(quote) || quote < 0 || quote > 9_999_999_999.99) {
        setErr('Quoted price must be a number from 0 to 9,999,999,999.99.');
        return;
      }
    }
    return run('notes', () => patch(`/bookings/${id}`, { admin_notes: notes.admin_notes, quoted_price: notes.quoted_price === '' ? null : Number(notes.quoted_price) }), 'Notes saved.');
  };
  const locked = b && TERMINAL.includes(b.status);
  return (
    <Modal title={b ? `Booking ${b.reference}` : 'Booking'} onClose={onClose} wide>
      {loading && !b ? <Spinner /> : error ? <ErrorBox>{parseError(error).message}</ErrorBox> : b && (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2"><Badge value={b.status} /><span className="text-sm text-night/60">Created {formatDateTime(b.created_at)}</span></div>
          {msg && <p className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{msg}</p>}
          <ErrorBox>{err}</ErrorBox>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Row k="Customer" v={b.customer_name} />
            <Row k="Phone" v={<a className="text-moss underline" href={`tel:+${b.customer_phone}`}>{prettyPhone(b.customer_phone)}</a>} />
            <Row k="Email" v={b.customer_email} />
            <Row k="Pickup" v={b.pickup_location} />
            <Row k="Destination" v={b.destination} />
            <Row k="Service" v={b.service_name} />
            <Row k="Date" v={formatDate(b.pickup_date)} />
            <Row k="Time" v={formatTime(b.pickup_time)} />
            <Row k="Passengers" v={b.passengers} />
            {b.vehicle_type && <Row k="Vehicle type" v={b.vehicle_type} />}
            {b.airport_direction && <Row k="Direction" v={b.airport_direction === 'ARRIVAL' ? 'Arrival' : 'Departure'} />}
            {b.airport_name && <Row k="Airport" v={b.airport_name} />}
            {b.flight_number && <Row k="Flight" v={b.flight_number} />}
            {b.luggage_count != null && <Row k="Luggage" v={b.luggage_count} />}
            <Row k="Driver" v={b.driver_name ? `${b.driver_name}${b.vehicle_plate ? ` · ${b.vehicle_plate}` : ''}` : null} />
            <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-bold uppercase tracking-wider text-night/50">Customer notes</dt><dd className="mt-0.5 whitespace-pre-line font-semibold">{b.notes || '—'}</dd></div>
          </dl>

          <section className="admin-card">
            <h3 className="mb-3 font-display text-base font-black uppercase">Pickup and destination map</h3>
            <BookingLocationMap booking={b} />
          </section>

          <section className="admin-card">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf/15 text-moss"><Send className="h-5 w-5" aria-hidden="true" /></span>
              <div><h3 className="font-display text-base font-black uppercase">Review, assign &amp; send passenger update</h3>
                <p className="mt-1 text-sm text-night/60">Choose an active driver and status. Press Send when you have checked the booking. The passenger and admin inbox receive the trip and driver details by email.</p></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="label">Assign active driver</span>
                <select className="input" aria-label="Assign active driver" value={driverId} onChange={(e) => setDriverId(e.target.value)} disabled={locked || drivers.loading}>
                  <option value="">Choose a driver</option>
                  {(drivers.data || []).filter((d) => d.is_active).map((d) => <option key={d.id} value={d.id}>{d.name} · {d.status.toLowerCase()}{d.vehicle_name ? ` · ${d.vehicle_name}` : ''}</option>)}
                </select>
              </label>
              <label className="block"><span className="label">Passenger email status</span>
                <select className="input" aria-label="Passenger email status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={locked}>
                  {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </label>
            </div>
            {!drivers.loading && !(drivers.data || []).filter((d) => d.is_active).length && <p className="mt-3 text-sm text-amber-800">No active drivers are available. Add or activate a driver before sending this update.</p>}
            <label className="mt-4 block"><span className="label">Note for booking history (optional)</span>
              <input className="input" placeholder="Add an internal note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
            </label>
            <div className="mt-4 flex flex-col gap-3 border-t border-night/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-night/55">Email goes to <strong>{b.customer_email || 'No passenger email saved'}</strong> and the configured admin inbox.</p>
              <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={!driverId || busy === 'dispatch' || locked || drivers.loading} onClick={sendUpdate}>
                <Send className="h-4 w-4" aria-hidden="true" /> {busy === 'dispatch' ? 'Saving & sending…' : 'Save assignment & send'}
              </button>
            </div>
          </section>

          <section className="admin-card">
            <h3 className="font-display text-base font-black uppercase">Internal notes &amp; quoted price</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_12rem]">
              <textarea className="input" rows={3} placeholder="Notes only your team sees" value={notes.admin_notes} onChange={(e) => setNotes((n) => ({ ...n, admin_notes: e.target.value }))} />
              <input className="input" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Quoted price" aria-label="Quoted price" value={notes.quoted_price} onChange={(e) => setNotes((n) => ({ ...n, quoted_price: e.target.value }))} />
            </div>
            {b.quoted_price != null && <p className="mt-2 text-sm text-night/60">Current quote: {money(b.quoted_price)}</p>}
            <button type="button" className="btn btn-outline btn-sm mt-3" disabled={busy === 'notes'} onClick={saveNotes}>Save notes</button>
          </section>

          <section>
            <h3 className="font-display text-base font-black uppercase">History</h3>
            <ol className="mt-3 space-y-2 border-l-2 border-leaf/50 pl-4 text-sm">
              {b.history.map((h) => (
                <li key={h.id}><Badge value={h.to_status} /> <span className="text-night/60">{formatDateTime(h.created_at)}{h.changed_by_name ? ` · ${h.changed_by_name}` : ''}</span>{h.note && <span className="block text-night/75">{h.note}</span>}</li>
              ))}
            </ol>
          </section>
          <section>
            <h3 className="font-display text-base font-black uppercase">Driver assignment history</h3>
            {b.assignment_history?.length ? <ol className="mt-3 space-y-2 border-l-2 border-leaf/50 pl-4 text-sm">
              {b.assignment_history.map((a) => <li key={a.id}>
                <strong>{a.driver_name}</strong>{a.previous_driver_name ? ` (reassigned from ${a.previous_driver_name})` : ''}
                <span className="text-night/60"> · {formatDateTime(a.assigned_at)}{a.assigned_by_name ? ` · ${a.assigned_by_name}` : ''}</span>
              </li>)}
            </ol> : <p className="mt-2 text-sm text-night/60">No assignment changes recorded yet.</p>}
          </section>
        </div>
      )}
    </Modal>
  );
}
