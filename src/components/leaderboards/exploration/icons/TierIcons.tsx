import React from 'react';

interface TierIconProps {
  size?: number;
  color?: string;
}

/** Local (1 country, 1 continent) — a flag on a pole. */
export function LocalTierIcon({ size = 16, color = 'currentColor' }: TierIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3.5 2v12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3.5 3h7.5l-1.5 2 1.5 2H3.5" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Rover (3 countries) — a region pin. */
export function RoverTierIcon({ size = 16, color = 'currentColor' }: TierIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5 0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none" />
      <circle cx="8" cy="6" r="1.6" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/** Continental (5 countries, 2 continents) — a continent silhouette. */
export function ContinentalTierIcon({ size = 16, color = 'currentColor' }: TierIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M2.5 5.5c.8-1.5 2.5-2 4-1.5.6.2 1 .8 1.5.8s.8-.5 1.5-.5c1.2 0 2 .8 2 2 0 .8-.5 1.5-1 2 .3.5.5 1 .3 1.6-.3 1-1.5 1.6-2.5 1.4-.5-.1-.8-.4-1.3-.4-.8 0-1.4.6-2.2.4-1.5-.4-2.5-2.5-2.3-4 .1-.6.5-1.2 0-1.8z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Globetrotter (10 countries, 3 continents) — a globe with a horizontal band. */
export function GlobetrotterTierIcon({ size = 16, color = 'currentColor' }: TierIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.2" fill="none" />
      <ellipse cx="8" cy="8" rx="6" ry="2.5" stroke={color} strokeWidth="1.2" fill="none" />
      <path d="M8 2v12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Worldgolfer (20 countries, 5 continents) — a globe with a laurel crescent above. */
export function WorldgolferTierIcon({ size = 16, color = 'currentColor' }: TierIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8.5" r="4" stroke={color} strokeWidth="1.2" fill="none" />
      <ellipse cx="8" cy="8.5" rx="4" ry="1.6" stroke={color} strokeWidth="1.1" fill="none" />
      <path d="M3 4.5c1-1 2.5-1.5 5-1.5s4 .5 5 1.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M2.5 4.5l.8.5M13.5 4.5l-.8.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Returns the matching tier icon component for a tier ID. */
export function getTierIcon(tierId: string): React.FC<TierIconProps> {
  switch (tierId) {
    case 'local':        return LocalTierIcon;
    case 'rover':        return RoverTierIcon;
    case 'continental':  return ContinentalTierIcon;
    case 'globetrotter': return GlobetrotterTierIcon;
    case 'worldgolfer':  return WorldgolferTierIcon;
    default:             return LocalTierIcon;
  }
}
