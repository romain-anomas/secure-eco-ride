export default function SectionHeading({ title, intro, tone = 'light', align = 'left', as: Tag = 'h2', className = '' }) {
  const dark = tone === 'dark';
  return (
    <div className={`${align === 'center' ? 'mx-auto text-center' : ''} max-w-2xl ${className}`}>
      <Tag className={`h-section ${dark ? 'text-white' : 'text-night'}`}>{title}</Tag>
      <div className={`rule-green mt-4 ${align === 'center' ? 'mx-auto' : ''}`} />
      {intro && <p className={`copy-lead mt-4 ${dark ? 'text-white/70' : 'text-night/70'}`}>{intro}</p>}
    </div>
  );
}
