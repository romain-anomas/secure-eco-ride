import { BellRing, ExternalLink, VolumeX, X } from 'lucide-react';

export default function PushAlertSheet({ alert, onOpen, onDismiss, soundActive, onStopSound, actionLabel = 'Open booking' }) {
  if (!alert) return null;

  return (
    <section
      className="fixed inset-x-3 bottom-3 z-[60] flex max-h-[52dvh] flex-col overflow-hidden rounded-3xl border border-leaf/40 bg-white shadow-[0_18px_70px_rgba(7,22,14,0.3)] ring-1 ring-black/5 sm:inset-x-auto sm:right-6 sm:top-20 sm:bottom-auto sm:w-[min(32rem,calc(100vw-3rem))] sm:max-h-[60vh]"
      role="region"
      aria-live="assertive"
      aria-labelledby="push-alert-title"
      aria-describedby="push-alert-body"
    >
      <div className="flex items-start gap-3 border-b border-night/10 bg-leaf/10 px-4 py-4 sm:px-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf text-night"><BellRing className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-leaf">New activity</p>
          <h2 id="push-alert-title" className="mt-1 text-lg font-black leading-tight text-night">{alert.title || 'New booking update'}</h2>
        </div>
        <button type="button" onClick={onDismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-night/60 hover:bg-night/5" aria-label="Dismiss notification">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <p id="push-alert-body" className="whitespace-pre-wrap break-words text-sm leading-6 text-night/80">{alert.body || 'A booking needs your attention.'}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-night/10 bg-white px-4 py-3 sm:px-5">
        <div>
          {soundActive && <button type="button" onClick={onStopSound} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-night/70 hover:bg-night/5">
            <VolumeX className="h-4 w-4" aria-hidden="true" /> Stop sound
          </button>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onDismiss} className="btn btn-outline btn-sm">Dismiss</button>
          <button type="button" onClick={onOpen} className="btn btn-primary btn-sm"><ExternalLink className="h-4 w-4" aria-hidden="true" />{actionLabel}</button>
        </div>
      </div>
    </section>
  );
}
