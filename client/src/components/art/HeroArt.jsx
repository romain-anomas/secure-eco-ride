import CarSilhouette from './CarSilhouette.jsx';
import Leaf from './Leaf.jsx';

/**
 * Illustrated hero used when no hero photo has been uploaded in Admin → Settings.
 * Green arc + vehicle + leaves, echoing the business card.
 */
export default function HeroArt({ className = '' }) {
  return (
    <div className={`relative mx-auto aspect-[1/1] w-full max-w-[560px] ${className}`} aria-hidden="true">
      <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="rgb(var(--c-green))" stopOpacity="0" />
            <stop offset=".35" stopColor="rgb(var(--c-green))" />
            <stop offset="1" stopColor="rgb(var(--c-green-bright))" />
          </linearGradient>
          <radialGradient id="disc" cx=".5" cy=".4" r=".7">
            <stop offset="0" stopColor="#1B2427" />
            <stop offset="1" stopColor="rgb(var(--c-dark))" />
          </radialGradient>
        </defs>
        <circle cx="280" cy="290" r="236" fill="url(#disc)" />
        <circle cx="280" cy="290" r="236" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".18" />
        {/* the big green arc */}
        <path d="M70 392A236 236 0 1 1 470 458" fill="none" stroke="url(#arcGrad)" strokeWidth="14" strokeLinecap="round" />
        {/* thin route line */}
        <path d="M40 470C170 420 250 500 380 452S520 400 548 420" fill="none" stroke="rgb(var(--c-green))" strokeOpacity=".55" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
        {/* road glow */}
        <ellipse cx="280" cy="438" rx="190" ry="14" fill="rgb(var(--c-green))" fillOpacity=".22" />
      </svg>
      <CarSilhouette className="absolute left-[3%] top-[45%] w-[94%] drop-shadow-[0_24px_24px_rgba(0,0,0,.45)]" />
      <Leaf className="absolute right-[6%] top-[6%] w-[15%] rotate-[32deg]" />
      <Leaf className="absolute right-[19%] top-[1%] w-[11%] rotate-[-6deg]" fill="rgb(var(--c-green-bright))" />
      <Leaf className="absolute left-[7%] top-[16%] w-[8%] -rotate-[38deg] opacity-80" />
    </div>
  );
}
