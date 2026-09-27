/** Side-view sedan silhouette. Drawn generically — it does not depict any real make or model. */
export default function CarSilhouette({ body = '#F2F5F3', glass = '#1B2427', wheel = '#0B0F10', hub = 'rgb(var(--c-green))', className = '' }) {
  return (
    <svg viewBox="0 0 220 80" className={className} role="img" aria-label="Taxi sedan" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <path
        fill={body}
        d="M8 54c0-6 3-9 11-11l32-6c7-9 19-16 37-17h36c17 1 29 9 38 18l32 6c9 2 13 5 13 12v4c0 3-2 5-5 5h-14a17 17 0 0 0-34 0H64a17 17 0 0 0-34 0H13c-3 0-5-2-5-5z"
      />
      {/* lower shade */}
      <path fill="rgba(11,15,16,.14)" d="M10 56h200v2c0 3-2 5-5 5h-14a17 17 0 0 0-34 0H64a17 17 0 0 0-34 0H15c-3 0-5-2-5-5z" />
      {/* glass */}
      <path fill={glass} d="M62 37c6-7 14-12 28-12h10v12zM108 25h13c11 1 20 6 27 12h-40z" />
      {/* door line + handle */}
      <path d="M104 26v33" stroke="rgba(11,15,16,.22)" strokeWidth="1.2" fill="none" />
      <rect x="112" y="41" width="10" height="2.2" rx="1.1" fill="rgba(11,15,16,.35)" />
      {/* lights */}
      <path fill="#FFD84A" d="M202 46h6c3 0 4 1 4 3v3h-10z" />
      <path fill="#D9342B" d="M8 48c0-2 1-3 4-3h5v7H8z" />
      {/* green accent line */}
      <path d="M22 51h176" stroke="rgb(var(--c-green))" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* wheels */}
      {[47, 171].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="60" r="15" fill={wheel} />
          <circle cx={cx} cy="60" r="8.5" fill="none" stroke={hub} strokeWidth="2.4" />
          <circle cx={cx} cy="60" r="3" fill={hub} />
        </g>
      ))}
    </svg>
  );
}
