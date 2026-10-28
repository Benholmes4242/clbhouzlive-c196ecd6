import type { CSSProperties } from 'react';

/** Shared floating-tile material. Glances, scorecards and reviews consume this
 * source without overriding its material; geometry and lifecycle stay local. */
export const GLASS_CARD = {
  background: 'rgba(22,22,26,0.92)',
  backdropFilter: 'blur(30px) saturate(160%)',
  WebkitBackdropFilter: 'blur(30px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
  borderRadius: 22,
} satisfies CSSProperties;

export const GLASS_BACKDROP = {
  background: 'rgba(8,8,10,0.45)',
  backdropFilter: 'blur(3px)',
  WebkitBackdropFilter: 'blur(3px)',
} satisfies CSSProperties;

/** Island controls share this material. DARK_CHROME_GLASS_MATERIAL remains
 * independent for the existing photo band and tournament hero consumers. */
export const ISLAND_GLASS = {
  background: 'rgba(14,14,16,0.84)',
  backdropFilter: 'blur(22px) saturate(150%)',
  WebkitBackdropFilter: 'blur(22px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.10)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
} satisfies CSSProperties;