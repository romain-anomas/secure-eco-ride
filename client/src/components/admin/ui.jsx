import { useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { STATUS_LABELS } from '../../utils/format.js';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-900', CONFIRMED: 'bg-sky-100 text-sky-900', ASSIGNED: 'bg-indigo-100 text-indigo-900',
  DRIVER_ON_WAY: 'bg-violet-100 text-violet-900', PICKED_UP: 'bg-teal-100 text-teal-900', COMPLETED: 'bg-green-100 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
  // generic
  AVAILABLE: 'bg-green-100 text-green-900', BUSY: 'bg-amber-100 text-amber-900', OFFLINE: 'bg-night/10 text-night/70', MAINTENANCE: 'bg-red-100 text-red-800',
  APPROVED: 'bg-green-100 text-green-900', HIDDEN: 'bg-night/10 text-night/70',
  SENT: 'bg-green-100 text-green-900', FAILED: 'bg-red-100 text-red-800', SKIPPED: 'bg-night/10 text-night/70',
  PARTIAL: 'bg-amber-100 text-amber-900', NOT_SENT: 'bg-night/10 text-night/70', NONE: 'bg-night/10 text-night/50',
  NEW: 'bg-amber-100 text-amber-900', READ: 'bg-sky-100 text-sky-900', REPLIED: 'bg-green-100 text-green-900',
  ADMIN: 'bg-night text-lime', STAFF: 'bg-night/10 text-night/70',
};

export function Badge({ value, label }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[value] || 'bg-night/10 text-night/70'}`}>{label || STATUS_LABELS[value] || String(value).replace(/_/g, ' ')}</span>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-night/60">{subtitle}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center gap-2 p-6 text-sm text-night/60"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {label}</div>
);

export function Empty({ children }) {
  return <div className="rounded-2xl border-2 border-dashed border-night/15 p-10 text-center text-night/60">{children}</div>;
}

export function ErrorBox({ children }) {
  return children ? <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">{children}</p> : null;
}

export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-night/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl focus:outline-none sm:max-h-[90dvh] sm:rounded-3xl sm:p-7 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-black uppercase tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-night/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ id, label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-night/55">{hint}</p>}
      {error && <p id={id ? `${id}-error` : undefined} className="field-error">{error}</p>}
    </div>
  );
}

export function Pager({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-night/60">{total} results · page {page} of {pages}</span>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function TableWrap({ children }) {
  return <div className="overflow-x-auto rounded-2xl border border-night/10 bg-white"><table className="w-full min-w-[720px] divide-y divide-night/10">{children}</table></div>;
}
