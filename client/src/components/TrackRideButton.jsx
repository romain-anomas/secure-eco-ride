const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.yego.passenger';

function YegoMark() {
  return (
    <span className="grid h-14 w-14 shrink-0 place-content-center rounded-xl bg-[#e52435] text-center text-white shadow-sm sm:h-16 sm:w-16" aria-hidden="true">
      <span className="font-sans text-xs font-black leading-none tracking-tight sm:text-base">YEGO</span>
      <span className="mx-auto mt-1 w-8 border-t border-white/75 pt-1 font-sans text-[8px] font-bold leading-none tracking-[.2em] sm:w-9 sm:text-[9px]">RW</span>
    </span>
  );
}

function GooglePlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" aria-hidden="true">
      <path fill="#00D7FE" d="M3.2 2.2c-.4.2-.7.7-.7 1.4v16.8c0 .7.3 1.2.7 1.4L12 12z" />
      <path fill="#00F076" d="m3.2 2.2 11 6.4L12 12z" />
      <path fill="#FFCE00" d="m14.2 8.6 6.1 3.5c.9.5.9 1.3 0 1.8l-6.1 3.5L12 12z" />
      <path fill="#FF3A44" d="m3.2 21.8 11-6.4L12 12z" />
    </svg>
  );
}

export default function TrackRideButton({ className = '' }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Track with YEGO Rwanda on Google Play (opens in a new tab)"
      className={`group inline-flex min-h-16 w-full items-center gap-3 rounded-xl border border-night/10 bg-white px-3 py-2.5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-leaf/60 hover:shadow-glow sm:w-auto sm:gap-4 sm:rounded-2xl sm:px-5 ${className}`}
    >
      <YegoMark />
      <span className="min-w-0 flex-1">
        <span className="block whitespace-nowrap font-sans text-sm font-extrabold uppercase leading-tight tracking-wide text-night sm:text-base sm:normal-case sm:tracking-normal">GET STARTED</span>
        <span className="mt-1 block font-sans text-xs leading-tight text-night/60 sm:text-sm">Track with YEGO Rwanda</span>
      </span>
      <GooglePlayMark />
    </a>
  );
}
