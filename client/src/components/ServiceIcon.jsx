import { Briefcase, Car, Clock, Leaf, MapPin, Plane, ShieldCheck, Users } from 'lucide-react';

const ICONS = { car: Car, plane: Plane, briefcase: Briefcase, clock: Clock, shield: ShieldCheck, leaf: Leaf, users: Users, map: MapPin };
export const ICON_OPTIONS = Object.keys(ICONS);

export default function ServiceIcon({ name, className = 'h-7 w-7' }) {
  const Icon = ICONS[name] || Car;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
