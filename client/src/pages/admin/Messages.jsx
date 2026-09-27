import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { del, parseError, patch } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Empty, ErrorBox, PageHeader, Spinner } from '../../components/admin/ui.jsx';
import { formatDateTime } from '../../utils/format.js';
import { prettyPhone } from '../../utils/phone.js';

export default function Messages() {
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/contact', { initial: [] });
  const [err, setErr] = useState('');

  const setStatus = async (id, status) => { setErr(''); try { await patch(`/contact/${id}`, { status }); reload(); } catch (e) { setErr(parseError(e).message); } };
  const remove = async (id) => { if (!window.confirm('Delete this message?')) return; try { await del(`/contact/${id}`); reload(); } catch (e) { setErr(parseError(e).message); } };

  return (
    <>
      <PageHeader title="Messages" subtitle="Contact and corporate-service requests from the website." />
      <ErrorBox>{err || (error && parseError(error).message)}</ErrorBox>
      {loading && !data?.length ? <Spinner /> : !data?.length ? <Empty>No messages yet.</Empty> : (
        <ul className="space-y-4">
          {data.map((m) => (
            <li key={m.id} className={`admin-card ${m.status === 'NEW' ? 'border-leaf' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{m.name}{m.company ? ` · ${m.company}` : ''} <span className="ml-1 rounded-full bg-night/10 px-2 py-0.5 text-xs font-bold">{m.type === 'CORPORATE' ? 'Corporate' : 'General'}</span></p>
                  <p className="text-sm text-night/60">
                    {m.phone && <a className="mr-3 text-moss underline" href={`tel:+${m.phone}`}>{prettyPhone(m.phone)}</a>}
                    {m.email && <a className="mr-3 text-moss underline" href={`mailto:${m.email}`}>{m.email}</a>}
                    {formatDateTime(m.created_at)}
                  </p>
                </div>
                <Badge value={m.status} />
              </div>
              <p className="mt-3 whitespace-pre-line text-night/80">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {m.status !== 'READ' && <button type="button" className="btn btn-outline btn-sm" onClick={() => setStatus(m.id, 'READ')}>Mark read</button>}
                {m.status !== 'REPLIED' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setStatus(m.id, 'REPLIED')}>Mark replied</button>}
                {isAdmin && <button type="button" className="btn btn-sm border-2 border-red-300 text-red-700 hover:bg-red-50" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
