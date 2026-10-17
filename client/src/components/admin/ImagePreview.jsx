import { useEffect, useState } from 'react';

export default function ImagePreview({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (failed) {
    return <div className={`grid place-items-center rounded-lg border border-dashed border-night/20 bg-mist p-2 text-center text-[10px] leading-tight text-night/55 ${className}`} role="status">Image unavailable</div>;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
