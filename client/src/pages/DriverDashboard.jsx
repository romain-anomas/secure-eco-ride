import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Mail, MapPin, Phone, RefreshCw, Users } from 'lucide-react';
import { get, patch, parseError } from '../services/api.js';
import { Badge, ErrorBox, Spinner } from '../components/admin/ui.jsx';
import BookingLocationMap from '../components/admin/BookingLocationMap.jsx';

function dateLabel(date, time) {
  if (!date) return 'Schedule not set';
  const d = new Date(`${date}T${time || '00:00:00'}Z`);
  return Number.isNaN(d.getTime()) ? `${date} ${time || ''}` : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DriverDashboard() {
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState('OFFLINE');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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

  async function toggleAvailability() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await patch('/driver/availability', { available: availability !== 'AVAILABLE' });
      setAvailability(result.data.status);
      setNotice(result.data.status === 'BUSY' ? 'You have an active job and remain marked busy.' : `Availability updated: ${result.data.status.toLowerCase()}.`);
    } catch (err) { setError(parseError(err).message); }
    finally { setBusy(false); }
  }

  if (loading) return <Spinner label="Loading your assigned rides…" />;
  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-bold uppercase tracking-widest text-leaf">Your work</p><h1 className="mt-1 font-display text-3xl font-black">Assigned rides</h1><p className="mt-2 text-sm text-night/60">Passenger and trip information for bookings assigned to you.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide ${availability === 'AVAILABLE' ? 'bg-green-100 text-green-800' : availability === 'BUSY' ? 'bg-amber-100 text-amber-800' : 'bg-night/10 text-night/65'}`}>{availability}</span>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || availability === 'BUSY'} onClick={toggleAvailability}>{busy ? 'Updating…' : availability === 'AVAILABLE' ? 'Set unavailable' : 'Set available'}</button>
        <button type="button" title="Refresh rides" className="grid h-10 w-10 place-items-center rounded-full border border-night/15 bg-white" onClick={() => { setLoading(true); load(); }}><RefreshCw className="h-4 w-4" /></button>
      </div>
    </div>
    {notice && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{notice}</p>}
    <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>
    {!bookings.length ? <div className="mt-8 rounded-2xl border border-night/10 bg-white p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-leaf/20"><CalendarDays className="h-5 w-5" /></div><h2 className="mt-3 font-bold">No assigned rides yet</h2><p className="mt-1 text-sm text-night/55">New jobs assigned by admin will appear here.</p></div> :
      <div className="mt-6 grid gap-4">
        {bookings.map((ride) => <article key={ride.id} className="overflow-hidden rounded-2xl border border-night/10 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-night/5 bg-white px-4 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-wider text-night/45">{ride.reference}</p><p className="mt-1 font-semibold">{dateLabel(ride.pickup_date, ride.pickup_time)}</p></div><Badge value={ride.status} /></div>
          <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
            <section><h2 className="text-xs font-black uppercase tracking-wider text-night/45">Passenger</h2><p className="mt-2 text-lg font-bold">{ride.customer_name}</p><div className="mt-3 flex flex-wrap gap-2">{ride.customer_phone && <a className="btn btn-outline btn-sm" href={`tel:${ride.customer_phone}`}><Phone className="h-4 w-4" />Call</a>}{ride.customer_email && <a className="btn btn-outline btn-sm" href={`mailto:${ride.customer_email}`}><Mail className="h-4 w-4" />Email</a>}</div><p className="mt-3 flex items-center gap-2 text-sm text-night/60"><Users className="h-4 w-4" />{ride.passengers} passenger{ride.passengers === 1 ? '' : 's'}</p></section>
            <section><h2 className="text-xs font-black uppercase tracking-wider text-night/45">Trip</h2><p className="mt-3 flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-leaf" /><span><b>Pickup</b><br />{ride.pickup_location}<br /><a className="mt-1 inline-block font-semibold text-leaf underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.pickup_latitude != null && ride.pickup_longitude != null ? `${ride.pickup_latitude},${ride.pickup_longitude}` : ride.pickup_location)}`}>Navigate to pickup</a></span></p><p className="mt-3 flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-night/35" /><span><b>Destination</b><br />{ride.destination}<br /><a className="mt-1 inline-block font-semibold text-leaf underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ride.destination_latitude != null && ride.destination_longitude != null ? `${ride.destination_latitude},${ride.destination_longitude}` : ride.destination)}`}>Navigate to destination</a></span></p>{(ride.vehicle_name || ride.vehicle_type) && <p className="mt-3 text-sm text-night/65"><b>Vehicle:</b> {ride.vehicle_name || ride.vehicle_type}{ride.vehicle_model ? ` · ${ride.vehicle_model}` : ''}{ride.vehicle_plate ? ` · ${ride.vehicle_plate}` : ''}</p>}</section>
            <section className="rounded-xl bg-mist p-3 sm:col-span-2"><h2 className="mb-3 text-xs font-black uppercase tracking-wider text-night/45">Passenger location</h2><BookingLocationMap booking={ride} /></section>
            {(ride.notes || ride.flight_number || ride.airport_name) && <section className="rounded-xl bg-mist p-3 text-sm sm:col-span-2"><h2 className="font-bold">Ride notes</h2>{ride.flight_number && <p>Flight: {ride.flight_number} {ride.airport_direction?.toLowerCase()}</p>}{ride.airport_name && <p>Airport: {ride.airport_name}</p>}{ride.notes && <p className="mt-1 whitespace-pre-wrap">{ride.notes}</p>}</section>}
          </div>
        </article>)}
      </div>}
  </div>;
}
