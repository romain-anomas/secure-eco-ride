import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api, del, get, parseError, patch, post } from '../../services/api.js';
import { normalizePhone } from '../../utils/phone.js';
import PhoneInput from '../PhoneInput.jsx';
import { DEFAULT_PHONE_COUNTRY, splitStoredPhone } from '../../utils/phoneCountries.js';
import useFetch from '../../hooks/useFetch.js';
import { Empty, ErrorBox, Field, Modal, PageHeader, Spinner, TableWrap } from './ui.jsx';

/**
 * Generic list + create/edit/delete screen.
 * fields: [{ name, label, type: text|textarea|number|money|select|checkbox|image|features|password|email|tel,
 *            options?: [{value,label}], optionsFrom?: { endpoint, label(row), params? }, required?, hint?, default?, list?: false }]
 * columns: [{ header, render(row) }]
 */
export default function ResourceManager({ title, subtitle, endpoint, listParams, columns, fields, canDelete = true, canCreate = true, addLabel = 'Add', empty = 'Nothing here yet.', itemName = 'item', renderRowAction }) {
  const { data, loading, error, reload } = useFetch(endpoint, { params: listParams, initial: [] });
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  async function remove(row) {
    setActionError('');
    try { await del(`${endpoint}/${row.id}`); setConfirmDelete(null); setNotice(`${itemName[0].toUpperCase()}${itemName.slice(1)} deleted.`); reload(); }
    catch (e) { setConfirmDelete(null); setActionError(parseError(e).message); }
  }

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        {canCreate && <button type="button" className="btn btn-primary btn-sm" onClick={() => { setNotice(''); setEditing('new'); }}><Plus className="h-4 w-4" aria-hidden="true" /> {addLabel}</button>}
      </PageHeader>
      {notice && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{notice}</p>}
      <ErrorBox>{actionError}</ErrorBox>
      {loading && !data?.length ? <Spinner /> : error ? <ErrorBox>{parseError(error).message}</ErrorBox> : !data?.length ? <Empty>{empty}</Empty> : (
        <TableWrap>
          <thead className="bg-mist"><tr>{columns.map((c) => <th key={c.header} className="th">{c.header}</th>)}<th className="th text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-night/5">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-mist/60">
                {columns.map((c) => <td key={c.header} className="td">{c.render(row)}</td>)}
                <td className="td text-right">
                  <div className="flex justify-end gap-1.5">
                    {renderRowAction?.(row, { reload, setNotice, setActionError })}
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-night/15 hover:border-leaf" onClick={() => { setNotice(''); setEditing(row); }} aria-label={`Edit ${itemName}`}><Pencil className="h-4 w-4" /></button>
                    {canDelete && <button type="button" className="grid h-9 w-9 place-items-center rounded-full border border-night/15 text-red-600 hover:border-red-500" onClick={() => setConfirmDelete(row)} aria-label={`Delete ${itemName}`}><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {editing && (
        <FormModal title={`${editing === 'new' ? 'Add' : 'Edit'} ${itemName}`} endpoint={endpoint} fields={fields} row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Saved.'); reload(); }} />
      )}
      {confirmDelete && (
        <Modal title={`Delete ${itemName}?`} onClose={() => setConfirmDelete(null)}>
          <p className="text-night/75">This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Keep</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(confirmDelete)}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function initialValue(f, row) {
  const v = row ? row[f.name] : f.default;
  if (f.type === 'phone' && row?.[f.name]) return splitStoredPhone(row[f.name]).nationalNumber;
  if (f.type === 'checkbox') return row ? Boolean(v) : v ?? true;
  if (f.type === 'features') return Array.isArray(v) ? v.join('\n') : '';
  if (f.type === 'password') return '';
  return v ?? '';
}

function FormModal({ title, endpoint, fields, row, onClose, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initialValue(f, row)])));
  const [phoneCountryCode, setPhoneCountryCode] = useState(() => row?.phone ? splitStoredPhone(row.phone).countryCode : DEFAULT_PHONE_COUNTRY);
  const [dyn, setDyn] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fields.filter((f) => f.optionsFrom).forEach((f) => {
      get(f.optionsFrom.endpoint, f.optionsFrom.params).then((r) => setDyn((d) => ({ ...d, [f.name]: r.data.map((x) => ({ value: x.id, label: f.optionsFrom.label(x) })) }))).catch(() => {});
    });
  }, [fields]);

  const set = (name, v) => { setValues((s) => ({ ...s, [name]: v })); setErrors((e) => ({ ...e, [name]: undefined })); };

  async function upload(name, file) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await api.post('/uploads', fd);
      set(name, res.data.data.url);
    } catch (e) { setError(parseError(e).message); } finally { setUploading(false); }
  }

  async function submit(ev) {
    ev.preventDefault();
    setError('');
    const payload = {};
    const fieldErrors = {};
    for (const f of fields) {
      let v = values[f.name];
      if (f.required && (v === '' || v === undefined || v === null)) fieldErrors[f.name] = `${f.label} is required`;
      if (f.type === 'password' && !v) continue;
      if (f.type === 'phone') {
        const normalized = normalizePhone(v, phoneCountryCode);
        if (!normalized && (f.required || v)) fieldErrors[f.name] = 'Enter a valid phone number for the selected country';
        else payload[f.name] = normalized;
        continue;
      }
      if (['number', 'money'].includes(f.type)) v = v === '' ? null : Number(v);
      if (['number', 'money'].includes(f.type) && v !== null) {
        if (!Number.isFinite(v) || (f.type === 'number' && !Number.isInteger(v))) fieldErrors[f.name] = 'Enter a valid number';
        else if ((f.min ?? (f.type === 'money' ? 0 : undefined)) !== undefined && v < (f.min ?? 0)) fieldErrors[f.name] = `Enter a value of at least ${f.min ?? 0}`;
        else if ((f.max ?? (f.type === 'money' ? 1_000_000_000 : undefined)) !== undefined && v > (f.max ?? 1_000_000_000)) fieldErrors[f.name] = `Enter a value no greater than ${f.max ?? 1_000_000_000}`;
      }
      if (f.type === 'features') v = String(v).split(/\n|,/).map((s) => s.trim()).filter(Boolean);
      if (f.type === 'select' && f.numeric) v = v === '' ? null : Number(v);
      payload[f.name] = v;
    }
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      setError('Please correct the highlighted fields.');
      return;
    }
    setBusy(true);
    try {
      if (row) await patch(`${endpoint}/${row.id}`, payload); else await post(endpoint, payload);
      onSaved();
    } catch (e) { const p = parseError(e); setErrors(p.fields); setError(p.message); } finally { setBusy(false); }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const err = errors[f.name];
            const cls = `input ${err ? 'input-error' : ''}`;
            const wide = ['textarea', 'features', 'image'].includes(f.type) || f.wide ? 'sm:col-span-2' : '';
            if (f.type === 'phone') {
              return <Field key={f.name} id={`resource-${f.name}`} label={`${f.label}${f.required ? ' *' : ''}`} hint={f.hint} error={err} className={wide}>
                <PhoneInput id={`resource-${f.name}`} value={values[f.name]} countryCode={phoneCountryCode}
                  onCountryCodeChange={setPhoneCountryCode}
                  onChange={(v) => { setValues((s) => ({ ...s, [f.name]: v })); setErrors((e) => ({ ...e, [f.name]: undefined })); }}
                  error={err} required={f.required} placeholder="e.g. 793 157 373" />
              </Field>;
            }
            if (f.type === 'checkbox') {
              return (
                <label key={f.name} className={`flex items-center gap-3 rounded-xl border border-night/15 px-4 py-3 ${wide}`}>
                  <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--c-green))]" checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} />
                  <span><span className="block text-sm font-semibold">{f.label}</span>{f.hint && <span className="block text-xs text-night/55">{f.hint}</span>}</span>
                </label>
              );
            }
            const opts = f.options || dyn[f.name] || [];
            return (
              <Field key={f.name} label={`${f.label}${f.required ? ' *' : ''}`} hint={f.hint} error={err} className={wide}>
                {f.type === 'textarea' ? <textarea rows={4} className={cls} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
                  : f.type === 'features' ? <textarea rows={3} className={cls} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} placeholder="One per line, e.g. Air conditioning" />
                  : f.type === 'select' ? (
                    <select className={cls} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                      {f.allowEmpty !== false && <option value="">{f.emptyLabel || '— None —'}</option>}
                      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'image' ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {values[f.name] && <img src={values[f.name]} alt="" className="h-16 w-24 rounded-lg border border-night/10 object-cover" />}
                      <label className="btn btn-outline btn-sm cursor-pointer"><Upload className="h-4 w-4" aria-hidden="true" /> {uploading ? 'Uploading…' : 'Upload image'}
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(f.name, e.target.files?.[0])} /></label>
                      {values[f.name] && <button type="button" className="text-sm font-semibold text-red-600" onClick={() => set(f.name, '')}>Remove</button>}
                    </div>
                  ) : <input className={cls} type={{ number: 'number', money: 'number', password: 'password', email: 'email', tel: 'tel' }[f.type] || 'text'} step={f.step ?? (f.type === 'money' ? '0.01' : f.type === 'number' ? '1' : undefined)} min={f.min ?? (f.type === 'money' ? 0 : undefined)} max={f.max ?? (f.type === 'money' ? 1_000_000_000 : undefined)}
                    value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} autoComplete={f.type === 'password' ? 'new-password' : 'off'} />}
              </Field>
            );
          })}
        </div>
        <div className="mt-5"><ErrorBox>{error}</ErrorBox></div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || uploading}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
