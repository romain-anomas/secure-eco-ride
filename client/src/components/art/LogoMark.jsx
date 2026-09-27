import CarSilhouette from './CarSilhouette.jsx';
import Leaf from './Leaf.jsx';

/** Round emblem: green arc + vehicle + leaves — the combination used on the Secure Eco Ride card. */
export default function LogoMark({ size = 48, className = '' }) {
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
        <circle cx="32" cy="32" r="30" fill="rgb(var(--c-black))" />
        <path d="M8 40a26 26 0 1 1 6 12" fill="none" stroke="rgb(var(--c-green))" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <CarSilhouette className="absolute left-[16%] top-[42%] w-[68%]" />
      <Leaf className="absolute -right-[2%] top-[4%] w-[26%] rotate-[28deg]" />
      <Leaf className="absolute right-[14%] -top-[6%] w-[20%] rotate-[-8deg]" fill="rgb(var(--c-green-bright))" />
    </span>
  );
}
