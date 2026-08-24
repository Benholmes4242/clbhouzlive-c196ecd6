import React from 'react';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';

/**
 * Canonical glass duration badge used across all tile grids and rails.
 * Matches the course glass pill treatment (semi-transparent dark fill +
 * backdrop-blur, white text, pill radius). Positioned absolute bottom-right
 * within a `position: relative` media container.
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
}: {
  seconds: number | null | undefined;
  bottom?: number;
  right?: number;
  fontSize?: number;
}) {
  if (!seconds) return null;
  const label = formatDuration(seconds);
  if (!label) return null;
  return (
    <div
      style={{
        position: 'absolute',
        bottom,
        right,
        zIndex: 2,
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
      }}
    >
      {label}
    </div>
  );
}
