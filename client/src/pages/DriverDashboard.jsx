import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Clock3, Mail, MapPin, Navigation, Phone, RefreshCw, Users } from 'lucide-react';
import { get, patch, post, parseError } from '../services/api.js';
import { Badge, ErrorBox, Spinner } from '../components/admin/ui.jsx';
import BookingLocationMap from '../components/admin/BookingLocationMap.jsx';
import { useSearchParams } from 'react-router-dom';

const CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

function dateLabel(date, time) {
  if (!date) return 'Schedule not set';
  const d = new Date(`${date}T${time || '00:00:00'}Z`);
  return Number.isNaN(d.getTime()) ? `${date} ${time || ''}` : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function mapDirections(ride, point) {
  const hasCoordinates = point === 'pickup'
    ? ride.pickup_latitude != null && ride.pickup_longitude != null
    : ride.destination_latitude != null && ride.destination_longitude != null;
  const destination = hasCoordinates
    ? point === 'pickup' ? `${ride.pickup_latitude},${ride.pickup_longitude}` : `${ride.destination_latitude},${ride.destination_longitude}`
    : point === 'pickup' ? ride.pickup_location : ride.destination;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function RideCard({ ride, selectedBookingId, confirming, completing, onConfirm, onCancel, onComplete }) {
  const active = !CLOSED_STATUSES.has(ride.status);
  return (
    <article id={`ride-${ride.id}`} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${String(ride.id) === selectedBookingId ? 'border-leaf ring-2 ring-leaf/35' : 'border-night/10'}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-night/5 bg-white px-4 py-4 sm:px-6">
        <div><p className="text-xs font-bold uppercase tracking-wider text-night/45">{ride.reference}</p><p className="mt-1 font-semibold">{dateLabel(ride.pickup_date, ride.pickup_time)}</p></div>
        <Badge value={ride.status} />
      </header>
      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
        <section>
          <h2 className="text-xs font-black uppercase tracking-wider text-night/45">Passenger</h2>
          <p className="mt-2 text-lg font-bold">{ride.customer_name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ride.customer_phone && <a className="btn btn-outline btn-sm" href={`tel:${ride.customer_phone}`}><Phone className="h-4 w-4" aria-hidden="true" />Call</a>}
            {ride.customer_email && <a className="btn btn-outline btn-sm" href={`mailto:${ride.customer_email}`}><Mail className="h-4 w-4" aria-hidden="true" />Email</a>}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-night/60"><Users className="h-4 w-4" aria-hidden="true" />{ride.passengers} passenger{ride.passengers === 1 ? '' : 's'}</p>
        </section>

        <section>
          <h2 className="text-xs font-black uppercase tracking-wider text-night/45">Trip and navigation</h2>
          <div className="mt-3 space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="font-bold">Pickup</p><p className="break-words text-night/70">{ride.pickup_location}</p>
                <a className="mt-2 inline-flex items-center gap-1.5 font-bold text-leaf underline" target="_blank" rel="noreferrer" href={mapDirections(ride, 'pickup')}><Navigation className="h-4 w-4" aria-hidden="true" />Navigate to pickup</a>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-night/40" aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="font-bold">Destination</p><p className="break-words text-night/70">{ride.destination}</p>
                <a className="mt-2 inline-flex items-center gap-1.5 font-bold text-leaf underline" target="_blank" rel="noreferrer" href={mapDirections(ride, 'destination')}><Navigation className="h-4 w-4" aria-hidden="true" />Navigate to destination</a>
              </div>
            </div>
          </div>
          {(ride.vehicle_name || ride.vehicle_type) && <p className="mt-4 border-t border-night/10 pt-3 text-sm text-night/65"><b>Vehicle:</b> {ride.vehicle_name || ride.vehicle_type}{ride.vehicle_model ? ` · ${ride.vehicle_model}` : ''}{ride.vehicle_plate ? ` · ${ride.vehicle_plate}` : ''}</p>}
        </section>

        <section className="rounded-xl bg-mist p-3 sm:col-span-2">
          <h2 className="mb-3 text-xs font-black uppercase tracking-wider text-night/45">Pickup and destination map</h2>
          <BookingLocationMap booking={ride} />
        </section>

        {(ride.notes || ride.flight_number || ride.airport_name) && <section className="rounded-xl bg-mist p-3 text-sm sm:col-span-2"><h2 className="font-bold">Ride notes</h2>{ride.flight_number && <p>Flight: {ride.flight_number} {ride.airport_direction?.toLowerCase()}</p>}{ride.airport_name && <p>Airport: {ride.airport_name}</p>}{ride.notes && <p className="mt-1 whitespace-pre-wrap">{ride.notes}</p>}</section>}

        {active && <section className="rounded-xl border border-leaf/20 bg-leaf/5 p-4 sm:col-span-2">
          {!confirming ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold">Finished this ride?</h2><p className="mt-1 text-sm text-night/60">Confirm completion to close the job and update your availability for admin.</p></div>
            <button type="button" className="btn btn-primary shrink-0" onClick={onConfirm}><Check className="h-4 w-4" aria-hidden="true" />Complete ride</button>
          </div> : <div>
            <p className="font-bold">Confirm ride completion</p>
            <p className="mt-1 text-sm text-night/60">This will mark {ride.reference} as completed. If you have no other active rides, admin can assign you another client.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled={completing} onClick={onComplete}>{completing ? 'Updating ride…' : 'Confirm completion'}</button>
              <button type="button" className="btn btn-outline" disabled={completing} onClick={onCancel}>Keep ride active</button>
            </div>
          </div>}
        </section>}
      </div>
    </article>
  );
}

export default function DriverDashboard() {
  const [searchParams] = useSearchParams();
  const selectedBookingId = searchParams.get('bookingId');
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState('OFFLINE');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await get('/driver/bookings');
      setBookings(result.data);
      setAvailability(result.meta?.availability || 'OFFLINE');
    } catch (err) { setError(parseError(err).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onAssignedJob = () => { load(); };
    window.addEventListener('ser-driver-job-assigned', onAssignedJob);
    return () => window.removeEventListener('ser-driver-job-assigned', onAssignedJob);
  }, [load]);
  useEffect(() => {
    if (!selectedBookingId || !bookings.some((booking) => String(booking.id) === selectedBookingId)) return;
    window.setTimeout(() => document.getElementById(`ride-${selectedBookingId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [bookings, selectedBookingId]);

  async function toggleAvailability() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await patch('/driver/availability', { available: availability !== 'AVAILABLE' });
      setAvailability(result.data.status);
      setNotice(result.data.status === 'BUSY' ? 'You have an active ride and remain marked busy.' : result.data.status === 'AVAILABLE' ? 'You are active and available for assignments.' : 'You are now inactive and unavailable for assignments.');
    } catch (err) { setError(parseError(err).message); }
    finally { setBusy(false); }
  }

  async function completeRide(ride) {
    setCompletingId(ride.id); setError(''); setNotice('');
    try {
      const result = await post(`/driver/bookings/${ride.id}/complete`);
      setConfirmingId(null);
      setNotice(result.data.availability === 'AVAILABLE'
        ? `${ride.reference} is complete. You are available for another assignment.`
        : `${ride.reference} is complete. You remain busy with another active ride.`);
      await load();
    } catch (err) { setError(parseError(err).message); }
    finally { setCompletingId(null); }
  }

  if (loading) return <Spinner label="Loading your assigned rides…" />;

  const activeRides = bookings.filter((ride) => !CLOSED_STATUSES.has(ride.status));
  const pastRides = bookings.filter((ride) => CLOSED_STATUSES.has(ride.status));
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-bold uppercase tracking-widest text-leaf">Driver portal</p><h1 className="mt-1 font-display text-3xl font-black">Your rides</h1><p className="mt-2 text-sm text-night/60">Manage assigned rides, navigate to each stop, and confirm when a ride is complete.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide ${availability === 'AVAILABLE' ? 'bg-green-100 text-green-800' : availability === 'BUSY' ? 'bg-amber-100 text-amber-800' : 'bg-night/10 text-night/65'}`}>{availability === 'AVAILABLE' ? 'Active' : availability === 'OFFLINE' ? 'Inactive' : 'Busy'}</span>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || availability === 'BUSY'} onClick={toggleAvailability}>{busy ? 'Updating…' : availability === 'AVAILABLE' ? 'Go inactive' : 'Go active'}</button>
        <button type="button" title="Refresh rides" className="grid h-10 w-10 place-items-center rounded-full border border-night/15 bg-white" onClick={() => { setLoading(true); load(); }}><RefreshCw className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>

    {notice && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{notice}</p>}
    <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>

    <section className="mt-7">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="font-display text-xl font-black">Active rides</h2><p className="mt-1 text-sm text-night/55">Jobs that still need your attention.</p></div><span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-night/65">{activeRides.length}</span></div>
      {!activeRides.length ? <div className="rounded-2xl border border-night/10 bg-white p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-leaf/20"><CalendarDays className="h-5 w-5" aria-hidden="true" /></div><h3 className="mt-3 font-bold">No active rides</h3><p className="mt-1 text-sm text-night/55">New jobs assigned by admin will appear here.</p></div> :
        <div className="grid gap-4">{activeRides.map((ride) => <RideCard key={ride.id} ride={ride} selectedBookingId={selectedBookingId} confirming={confirmingId === ride.id} completing={completingId === ride.id} onConfirm={() => setConfirmingId(ride.id)} onCancel={() => setConfirmingId(null)} onComplete={() => completeRide(ride)} />)}</div>}
    </section>

    <details className="mt-8 rounded-2xl border border-night/10 bg-white p-4 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span><span className="block font-display text-xl font-black">Ride history</span><span className="mt-1 block text-sm text-night/55">Completed and cancelled rides.</span></span><span className="rounded-full bg-mist px-3 py-1 text-sm font-bold text-night/65">{pastRides.length}</span></summary>
      {pastRides.length ? <div className="mt-5 grid gap-4">{pastRides.map((ride) => <RideCard key={ride.id} ride={ride} selectedBookingId={selectedBookingId} />)}</div> : <p className="mt-5 flex items-center gap-2 text-sm text-night/55"><Clock3 className="h-4 w-4" aria-hidden="true" />No ride history yet.</p>}
    </details>
  </div>;
}
