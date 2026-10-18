import { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Send } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { parseError, post } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, Empty, ErrorBox, PageHeader, Pager, Spinner, TableWrap } from '../../components/admin/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

const MODE_TEXT = {
  FALLBACK: 'Not connected — WhatsApp Cloud API credentials are missing. Notifications are NOT sent automatically.',
  CLOUD_API_TEXT: 'Connected (free-text messages). WhatsApp only delivers these to numbers that messaged your business number in the last 24 hours.',
  CLOUD_API_TEMPLATE: 'Connected (approved template messages).',
};

export default function WhatsAppLogs() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const cfg = useFetch('/whatsapp/status');
  const logs = useFetch('/whatsapp/logs', { params: { page, limit: 50, ...(status ? { status } : {}) }, initial: [] });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function act(name, fn, done) {
    setBusy(name); setErr(''); setMsg('');
    try { const r = await fn(); setMsg(typeof done === 'function' ? done(r) : done); await logs.reload(); } catch (e) { setErr(parseError(e).message); } finally { setBusy(''); }
  }
  const test = () => act('test', () => post('/whatsapp/test'), (r) => (r.data.configured ? `Test finished: ${r.data.results.filter((x) => x.status === 'SENT').length} of ${r.data.results.length} sent.` : 'Nothing was sent: WhatsApp Cloud API is not configured.'));
  const retry = (id) => act(`r${id}`, () => post(`/whatsapp/logs/${id}/retry`), 'Retry finished.');

  const c = cfg.data;
  return (
    <>
      <PageHeader title="WhatsApp logs" subtitle="Every booking notification, per business number.">
        <button type="button" className="btn btn-outline btn-sm" onClick={logs.reload}><RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh</button>
        {isAdmin && <button type="button" className="btn btn-dark btn-sm" onClick={test} disabled={busy === 'test'}><Send className="h-4 w-4" aria-hidden="true" /> Send test message</button>}
      </PageHeader>

      {c && (
        <div className={`mb-5 flex gap-3 rounded-2xl border p-4 text-sm ${c.configured ? 'border-green-300 bg-green-50 text-green-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
          {c.configured ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />}
          <div>
            <p className="font-bold">{MODE_TEXT[c.mode]}</p>
            <p className="mt-1">Recipients: {c.recipients.join(', ') || 'none configured'}{c.templateName ? ` · template: ${c.templateName}` : ''}</p>
          </div>
        </div>
      )}
      {msg && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{msg}</p>}
      <ErrorBox>{err || (logs.error && parseError(logs.error).message)}</ErrorBox>

      <div className="my-4 max-w-xs">
        <select className="input" aria-label="Filter by status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option><option value="SENT">Sent</option><option value="FAILED">Failed</option><option value="SKIPPED">Skipped (not configured)</option>
        </select>
      </div>

      {logs.loading && !logs.data?.length ? <Spinner /> : !logs.data?.length ? <Empty>No WhatsApp activity yet.</Empty> : (
        <>
          <ul className="space-y-3 sm:hidden">
            {logs.data.map((l) => <li key={l.id} className="admin-card !p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-night/50">{l.reference || 'Booking update'}</p><p className="mt-1 break-all text-sm font-semibold">{l.recipient}</p></div>
                <Badge value={l.status} />
              </div>
              <p className="mt-2 text-xs text-night/55">{formatDateTime(l.created_at)}</p>
              <details className="mt-3 rounded-xl bg-mist p-3 text-sm">
                <summary className="cursor-pointer font-semibold text-moss">View message</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs">{l.message}</pre>
              </details>
              {l.error && <p className="mt-3 break-words text-xs text-red-700">{l.error}</p>}
              {l.status !== 'SENT' && <button type="button" className="btn btn-outline btn-sm mt-3 w-full" disabled={busy === `r${l.id}`} onClick={() => retry(l.id)}>Retry</button>}
            </li>)}
          </ul>
          <div className="hidden sm:block">
          <TableWrap>
            <thead className="bg-mist"><tr>{['Booking ID', 'Recipient', 'Message', 'Status', 'Error', 'Date', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-night/5">
              {logs.data.map((l) => (
                <tr key={l.id} className="align-top hover:bg-mist/60">
                  <td className="td whitespace-nowrap font-bold">{l.reference || '—'}</td>
                  <td className="td whitespace-nowrap">{l.recipient}</td>
                  <td className="td"><details><summary className="cursor-pointer text-moss underline">View</summary><pre className="mt-2 max-w-sm whitespace-pre-wrap text-xs">{l.message}</pre></details></td>
                  <td className="td"><Badge value={l.status} /></td>
                  <td className="td max-w-xs text-xs text-red-700">{l.error || ''}</td>
                  <td className="td whitespace-nowrap text-night/60">{formatDateTime(l.created_at)}</td>
                  <td className="td">{l.status !== 'SENT' && <button type="button" className="btn btn-outline btn-sm !px-3" disabled={busy === `r${l.id}`} onClick={() => retry(l.id)}>Retry</button>}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          </div>
          <Pager page={page} limit={logs.meta?.limit || 50} total={logs.meta?.total || 0} onPage={setPage} />
        </>
      )}
    </>
  );
}
