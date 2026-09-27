/** Single leaf shape used in the logo and decorative motifs. */
export default function Leaf({ className = '', style, fill = 'rgb(var(--c-green))', vein = 'rgba(11,15,16,.35)' }) {
  return (
    <svg viewBox="0 0 48 64" className={className} style={style} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path fill={fill} d="M24 2C40 14 46 30 38 46 34 54 28 60 24 62 20 60 14 54 10 46 2 30 8 14 24 2z" />
      <path d="M24 10v50M24 26l-9-7M24 36l10-8M24 46l-8-6" stroke={vein} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
