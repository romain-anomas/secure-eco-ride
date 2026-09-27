import { useState } from 'react';
import { Search } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, PageHeader, Spinner, TableWrap } from '../../components/admin/ui.jsx';
import { formatDateTime } from '../../utils/format.js';
import { prettyPhone } from '../../utils/phone.js';
import { parseError } from '../../services/api.js';

export default function Customers() {
  const [q, setQ] = useState('');
  const { data, loading, error } = useFetch('/customers', { params: q ? { q } : {}, initial: [] });
  return (
    <>
      <PageHeader title="Customers" subtitle="Customers are created automatically from bookings, matched by phone number." />
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-night/40" aria-hidden="true" />
        <input className="input pl-10" placeholder="Search name or phone" aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorBox>{error && parseError(error).message}</ErrorBox>
      {loading && !data?.length ? <Spinner /> : !data?.length ? <Empty>No customers yet.</Empty> : (
        <TableWrap>
          <thead className="bg-mist"><tr>{['Name', 'Phone', 'Email', 'Bookings', 'Last booking', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-night/5">
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-mist/60">
                <td className="td font-semibold">{c.name}</td>
                <td className="td whitespace-nowrap"><a className="text-moss underline" href={`tel:+${c.phone}`}>{prettyPhone(c.phone)}</a></td>
                <td className="td">{c.email || '—'}</td>
                <td className="td">{c.booking_count}</td>
                <td className="td whitespace-nowrap">{c.last_booking_at ? formatDateTime(c.last_booking_at) : '—'}</td>
                <td className="td"><Badge value={c.is_blocked ? 'CANCELLED' : 'AVAILABLE'} label={c.is_blocked ? 'Blocked' : 'Active'} /></td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
