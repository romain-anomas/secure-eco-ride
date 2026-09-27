import { useEffect, useState } from 'react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { get, parseError, patch, post } from '../../services/api.js';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Modal, PageHeader, Pager, Spinner, TableWrap } from '../../components/admin/ui.jsx';
import { BOOKING_STATUSES, STATUS_LABELS, formatDate, formatDateTime, formatTime, money } from '../../utils/format.js';
import { prettyPhone } from '../../utils/phone.js';

const TERMINAL = ['COMPLETED', 'CANCELLED'];

export default function Bookings() {
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '', q: '' });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [cancelRow, setCancelRow] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const params = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page, limit: 25 };
  const { data, meta: rawMeta, loading, error: loadError, reload, setData } = useFetch('/bookings', { params, initial: [] });
  const meta = rawMeta || { total: 0, limit: 25 };

  // refresh every 30 s so new website bookings show up without reloading
  useEffect(() => {
    const t = setInterval(() => { reload(); }, 30000);
    return () => clearInterval(t);
  }, [reload]);

  const setFilter = (k) => (e) => { setPage(1); setFilters((f) => ({ ...f, [k]: e.target.value })); };

  async function quickStatus(row, status, note) {
    setBusyId(row.id); setError('');
    try {
      const res = await patch(`/bookings/${row.id}/status`, { status, note });
      setData((list) => list.map((b) => (b.id === row.id ? { ...b, ...res.data } : b)));
      setCancelRow(null);
    } catch (e) { setError(parseError(e).message); } finally { setBusyId(null); }
  }

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
          <TableWrap>
            <thead className="bg-mist">
              <tr>{['Booking ID', 'Customer', 'Phone', 'Pickup', 'Destination', 'Date', 'Time', 'Service', 'Driver', 'Status', 'WhatsApp', 'Created', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr>
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
                  <td className="td"><Badge value={b.whatsapp_status} label={{ SENT: 'Sent', PARTIAL: 'Partial', FAILED: 'Failed', NOT_SENT: 'Not sent', NONE: '—' }[b.whatsapp_status]} /></td>
                  <td className="td whitespace-nowrap text-night/60">{formatDateTime(b.created_at)}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" className="btn btn-dark btn-sm !px-3" onClick={() => setOpenId(b.id)}><Eye className="h-3.5 w-3.5" aria-hidden="true" /> View</button>
                      {b.status === 'PENDING' && <button type="button" className="btn btn-primary btn-sm !px-3" disabled={busyId === b.id} onClick={() => quickStatus(b, 'CONFIRMED', 'Confirmed by admin')}>Confirm</button>}
                      {!TERMINAL.includes(b.status) && <button type="button" className="btn btn-outline btn-sm !px-3" onClick={() => setOpenId(b.id)}>Assign driver</button>}
                      {!TERMINAL.includes(b.status) && <button type="button" className="btn btn-sm !px-3 border-2 border-red-300 text-red-700 hover:bg-red-50" onClick={() => setCancelRow(b)}>Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pager page={page} limit={meta.limit || 25} total={meta.total || 0} onPage={setPage} />
        </>
      )}

      {openId && <BookingDetail id={openId} onClose={() => setOpenId(null)} onChanged={reload} />}
      {cancelRow && (
        <Modal title="Cancel this booking?" onClose={() => setCancelRow(null)}>
          <p className="text-night/75"><strong>{cancelRow.reference}</strong> for {cancelRow.customer_name} will be marked as cancelled. Remember to let the customer know.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setCancelRow(null)}>Keep booking</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => quickStatus(cancelRow, 'CANCELLED', 'Cancelled by admin')}>Cancel booking</button>
          </div>
        </Modal>
      )}
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
  const [links, setLinks] = useState(null);

  useEffect(() => {
    if (b) { setStatus(b.status); setDriverId(b.driver_id || ''); setNotes({ admin_notes: b.admin_notes || '', quoted_price: b.quoted_price ?? '' }); }
  }, [b?.id, b?.status, b?.driver_id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(name, fn, done) {
    setBusy(name); setErr(''); setMsg('');
    try { await fn(); setMsg(done); await reload(); onChanged?.(); } catch (e) { setErr(parseError(e).message); } finally { setBusy(''); }
  }

  const changeStatus = () => run('status', () => patch(`/bookings/${id}/status`, { status, note: note || null }), 'Status updated.').then(() => setNote(''));
  const assign = () => run('assign', () => patch(`/bookings/${id}/assign`, { driver_id: Number(driverId) }), 'Driver assigned.');
  const saveNotes = () => run('notes', () => patch(`/bookings/${id}`, { admin_notes: notes.admin_notes, quoted_price: notes.quoted_price === '' ? null : Number(notes.quoted_price) }), 'Notes saved.');
  const resend = () => run('resend', async () => {
    const res = await post(`/whatsapp/send-booking/${id}`);
    if (!res.data.configured) throw new Error('WhatsApp Cloud API is not configured — nothing was sent automatically. Use the manual links below.');
  }, 'Notification sent again — see the log below.');
  const retryOne = (logId) => run(`retry${logId}`, () => post(`/whatsapp/logs/${logId}/retry`), 'Retry finished — see the log below.');
  async function showLinks() {
    setErr('');
    try { setLinks((await get(`/whatsapp/booking/${id}/links`)).data); } catch (e) { setErr(parseError(e).message); }
  }

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

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="admin-card">
              <h3 className="font-display text-base font-black uppercase">Change status</h3>
              <select className="input mt-3" aria-label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <input className="input mt-3" placeholder="Optional note (kept in history)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
              <button type="button" className="btn btn-primary btn-sm mt-3" disabled={busy === 'status' || status === b.status} onClick={changeStatus}>Update status</button>
            </div>
            <div className="admin-card">
              <h3 className="font-display text-base font-black uppercase">Assign driver</h3>
              <select className="input mt-3" aria-label="Driver" value={driverId} onChange={(e) => setDriverId(e.target.value)} disabled={locked}>
                <option value="">Choose a driver</option>
                {(drivers.data || []).filter((d) => d.is_active).map((d) => <option key={d.id} value={d.id}>{d.name} — {d.status.toLowerCase()}{d.vehicle_name ? ` · ${d.vehicle_name}` : ''}</option>)}
              </select>
              {!drivers.loading && !(drivers.data || []).length && <p className="mt-2 text-sm text-night/60">No drivers yet. Add them under Drivers.</p>}
              <button type="button" className="btn btn-primary btn-sm mt-3" disabled={!driverId || busy === 'assign' || locked || Number(driverId) === b.driver_id} onClick={assign}>Assign driver</button>
            </div>
          </section>

          <section className="admin-card">
            <h3 className="font-display text-base font-black uppercase">Internal notes &amp; quoted price</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_12rem]">
              <textarea className="input" rows={3} placeholder="Notes only your team sees" value={notes.admin_notes} onChange={(e) => setNotes((n) => ({ ...n, admin_notes: e.target.value }))} />
              <input className="input" type="number" min="0" step="0.01" placeholder="Quoted price" aria-label="Quoted price" value={notes.quoted_price} onChange={(e) => setNotes((n) => ({ ...n, quoted_price: e.target.value }))} />
            </div>
            {b.quoted_price != null && <p className="mt-2 text-sm text-night/60">Current quote: {money(b.quoted_price)}</p>}
            <button type="button" className="btn btn-outline btn-sm mt-3" disabled={busy === 'notes'} onClick={saveNotes}>Save notes</button>
          </section>

          <section className="admin-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-black uppercase">WhatsApp notification</h3>
              <div className="flex gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={showLinks}>Manual send links</button>
                <button type="button" className="btn btn-dark btn-sm" disabled={busy === 'resend'} onClick={resend}>Send to all numbers again</button>
              </div>
            </div>
            {b.whatsapp_logs.length ? (
              <ul className="mt-4 divide-y divide-night/10 text-sm">
                {b.whatsapp_logs.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                    <div><span className="font-semibold">{l.recipient}</span> <Badge value={l.status} />{l.attempts > 1 && <span className="ml-2 text-xs text-night/50">{l.attempts} attempts</span>}
                      {l.error && <p className="mt-1 max-w-xl text-xs text-red-700">{l.error}</p>}</div>
                    {l.status !== 'SENT' && <button type="button" className="btn btn-outline btn-sm !px-3" disabled={busy === `retry${l.id}`} onClick={() => retryOne(l.id)}>Retry</button>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-night/60">No notification attempts recorded.</p>}
            {links && (
              <div className="mt-4 rounded-xl bg-mist p-4">
                <p className="text-sm text-night/70">These open WhatsApp with the message ready — <strong>you must still press Send</strong> in WhatsApp.</p>
                <div className="mt-3 flex flex-wrap gap-2">{links.links.map((l) => <a key={l.recipient} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm">{l.label}</a>)}</div>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs">{links.message}</pre>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-display text-base font-black uppercase">History</h3>
            <ol className="mt-3 space-y-2 border-l-2 border-leaf/50 pl-4 text-sm">
              {b.history.map((h) => (
                <li key={h.id}><Badge value={h.to_status} /> <span className="text-night/60">{formatDateTime(h.created_at)}{h.changed_by_name ? ` · ${h.changed_by_name}` : ''}</span>{h.note && <span className="block text-night/75">{h.note}</span>}</li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Modal>
  );
}
