import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api, del, parseError, patch, post, resolveGalleryAssetUrl } from '../../services/api.js';
import useFetch from '../../hooks/useFetch.js';
import { Badge, Empty, ErrorBox, Field, Modal, PageHeader, Spinner } from '../../components/admin/ui.jsx';

const EMPTY_FORM = { title: '', caption: '', media_type: 'IMAGE', media_url: '', is_published: true };

export default function GalleryAdmin() {
  const { data, loading, error, reload } = useFetch('/gallery/admin', { initial: [] });
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');

  async function remove(item) {
    setActionError('');
    try {
      await del(`/gallery/${item.id}`);
      setDeleting(null);
      setNotice('Gallery post deleted.');
      reload();
    } catch (err) {
      setActionError(parseError(err).message);
    }
  }

  return <>
    <PageHeader title="Gallery" subtitle="Publish images and videos on the home page.">
      <button type="button" className="btn btn-primary btn-sm" onClick={() => { setNotice(''); setEditing('new'); }}><Plus className="h-4 w-4" aria-hidden="true" /> Add post</button>
    </PageHeader>
    {notice && <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm font-medium text-green-800" role="status">{notice}</p>}
    <ErrorBox>{actionError}</ErrorBox>
    {loading && !data?.length ? <Spinner /> : error ? <ErrorBox>{parseError(error).message}</ErrorBox> : !data?.length
      ? <Empty>No gallery posts yet. Add an image or video to show it on the home page.</Empty>
      : <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((item) => <li key={item.id} className="overflow-hidden rounded-2xl border border-night/10 bg-white shadow-sm">
        {item.media_type === 'VIDEO'
          ? <div className="aspect-[4/3] bg-night"><video className="h-full w-full object-cover" src={item.media_url} controls preload="metadata" aria-label={item.title} /></div>
          : <img className="aspect-[4/3] w-full object-cover" src={item.media_url} alt={item.caption || item.title} />}
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3"><h2 className="font-bold">{item.title}</h2><Badge value={item.is_published ? 'APPROVED' : 'HIDDEN'} label={item.is_published ? 'Published' : 'Hidden'} /></div>
          {item.caption && <p className="line-clamp-3 text-sm text-night/60">{item.caption}</p>}
          <div className="flex justify-end gap-2 border-t border-night/10 pt-3">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setNotice(''); setEditing(item); }}><Pencil className="h-4 w-4" aria-hidden="true" /> Edit</button>
            <button type="button" className="btn btn-outline btn-sm text-red-600" onClick={() => setDeleting(item)} aria-label={`Delete ${item.title}`}><Trash2 className="h-4 w-4" aria-hidden="true" /> Delete</button>
          </div>
        </div>
      </li>)}</ul>}

    {editing && <GalleryForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice('Gallery post saved.'); reload(); }} />}
    {deleting && <Modal title="Delete gallery post?" onClose={() => setDeleting(null)}>
      <p className="text-night/75">“{deleting.title}” will be removed from the gallery.</p>
      <div className="mt-6 flex justify-end gap-2"><button type="button" className="btn btn-outline btn-sm" onClick={() => setDeleting(null)}>Cancel</button><button type="button" className="btn btn-danger btn-sm" onClick={() => remove(deleting)}>Delete</button></div>
    </Modal>}
  </>;
}

function GalleryForm({ item, onClose, onSaved }) {
  const [values, setValues] = useState(() => item ? {
    title: item.title,
    caption: item.caption || '',
    media_type: item.media_type,
    media_url: item.media_url,
    is_published: Boolean(item.is_published),
  } : EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setFilePreview('');
      return undefined;
    }
    const preview = URL.createObjectURL(file);
    setFilePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  function set(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      let media = { url: values.media_url, media_type: values.media_type };
      if (file) {
        const formData = new FormData();
        formData.append('media', file);
        const uploaded = await api.post('/uploads/gallery', formData, { timeout: 300000 });
        media = uploaded.data.data;
      }
      if (!media.url) throw new Error('Choose an image or video to upload.');
      const payload = {
        title: values.title.trim(),
        caption: values.caption.trim(),
        media_type: media.media_type,
        media_url: media.url,
        is_published: values.is_published,
      };
      if (item) await patch(`/gallery/${item.id}`, payload);
      else await post('/gallery', payload);
      onSaved();
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setBusy(false);
    }
  }

  const mediaPreview = filePreview || resolveGalleryAssetUrl(values.media_url);
  return <Modal title={`${item ? 'Edit' : 'Add'} gallery post`} onClose={onClose}>
    <form onSubmit={submit} className="space-y-4">
      <Field id="gallery-title" label="Title *"><input id="gallery-title" className="input" required maxLength={120} value={values.title} onChange={(event) => set('title', event.target.value)} /></Field>
      <Field id="gallery-caption" label="Caption" hint="Optional text shown with the gallery post."><textarea id="gallery-caption" className="input" rows={3} maxLength={1000} value={values.caption} onChange={(event) => set('caption', event.target.value)} /></Field>
      <Field id="gallery-media" label={item ? 'Replace media (optional)' : 'Image or video *'} hint="JPG, PNG, WebP, AVIF, MP4, WebM or MOV. Maximum 50 MB.">
        <div className="space-y-3">
          <label className="btn btn-outline btn-sm w-fit cursor-pointer"><Upload className="h-4 w-4" aria-hidden="true" /> {file ? 'Choose different file' : 'Choose media'}
            <input id="gallery-media" type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile) setValues((current) => ({ ...current, media_type: nextFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE' }));
              setError('');
            }} />
          </label>
          {mediaPreview && (file?.type.startsWith('video/') || (!file && values.media_type === 'VIDEO')
            ? <video className="max-h-56 w-full rounded-xl bg-night object-contain" src={mediaPreview} controls preload="metadata" />
            : <img className="max-h-56 w-full rounded-xl object-cover" src={mediaPreview} alt="Gallery media preview" />)}
        </div>
      </Field>
      <label className="flex items-center gap-3 rounded-xl border border-night/15 px-4 py-3">
        <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--c-green))]" checked={values.is_published} onChange={(event) => set('is_published', event.target.checked)} />
        <span><span className="block text-sm font-semibold">Show on home page</span><span className="block text-xs text-night/55">Unpublished posts are only visible here.</span></span>
      </label>
      <ErrorBox>{error}</ErrorBox>
      <div className="flex justify-end gap-2"><button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save post'}</button></div>
    </form>
  </Modal>;
}
