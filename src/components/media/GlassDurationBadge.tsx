import React from 'react';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';

/**
 * Canonical glass badge used across all tile grids and rails — duration, media
 * counts and review ratings all wear it. Semi-transparent dark fill +
 * backdrop-blur, white text, pill radius. Absolutely positioned within a
 * `position: relative` media container unless `inline` is set.
 *
 * THE GLASS VALUES ARE SETTLED. Do not fork this component; extend it.
 * The badge is the container only — a caller may colour its own content
 * (the review rating is amber; duration and counts stay white).
 */

export type GlassBadgeCorner = 'bottom-right' | 'top-left';

/**
 * THE glass values, as style properties, for chrome that is not a badge —
 * the Tour header's burger and tour picker (BRIEF_TOUR_HERO_FLUSH_AND_PICKER
 * §2/§4 both name this file as the single source). Import these; never
 * re-type the fill or the blur radius somewhere else.
 */
export const GLASS_CHROME = {
  background: 'rgba(15,23,42,0.35)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
} as const;

export function GlassBadge({
  children,
  corner = 'bottom-right',
  inset = 6,
  fontSize = 10,
  inline = false,
  style,
}: {
  children: React.ReactNode;
  corner?: GlassBadgeCorner;
  inset?: number;
  fontSize?: number;
  /** Render in normal flow (for tiles that lay their overlays out in a row). */
  inline?: boolean;
  style?: React.CSSProperties;
}) {
  const placement: React.CSSProperties = inline
    ? {}
    : corner === 'top-left'
      ? { position: 'absolute', left: inset, top: inset }
      : { position: 'absolute', right: inset, bottom: inset };
  return (
    <span
      style={{
        ...placement,
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 3,
        background: 'rgba(15,23,42,0.35)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: '#fff',
        fontWeight: 600,
        fontSize,
        lineHeight: 1.2,
        padding: '2px 8px',
        borderRadius: 999,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Thin duration wrapper — the seven pre-existing consumers keep their API.
 *
 * IT DOES NOT COUNT DOWN because it is used on POSTER tiles with no playing
 * element — there is no playhead to read, and a frozen countdown would read as
 * broken. Give it a currentTime and it inherits the countdown automatically.
 */
export function GlassDurationBadge({
  seconds,
  bottom = 6,
  right = 6,
  fontSize = 10,
  inline = false,
}: {
  seconds: number | null | undefined;
  bottom?: number;
  right?: number;
  fontSize?: number;
  inline?: boolean;
}) {
  if (!seconds) return null;
  const label = formatDuration(seconds);
  if (!label) return null;
  return (
    <GlassBadge
      inline={inline}
      fontSize={fontSize}
      style={inline ? undefined : { position: 'absolute', bottom, right, left: 'auto', top: 'auto' }}
    >
      {label}
    </GlassBadge>
  );
}
