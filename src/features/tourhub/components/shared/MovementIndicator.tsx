/**
 * MovementIndicator — week-over-week ranking delta.
 * ▲N green / ▼N red / nothing when delta is 0 or null.
 *
 * Usage is gated to ranking systems that have weekly snapshots.
 * Currently only sr_world_rankings (OWGR) has prior_rank data, so callers
 * should pass `null` outside of the OWGR sort. See PlayerCardV2 wiring.
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

interface MovementIndicatorProps {
  /** Positive = moved up, negative = moved down, 0 = unchanged, null/undefined = no data. */
  delta: number | null | undefined;
}

export function MovementIndicator({ delta }: MovementIndicatorProps) {
  if (delta == null || delta === 0) return null;
  if (delta > 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          color: '#047857',
          fontSize: 10,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <TrendingUp size={10} strokeWidth={2.8} />
        {delta}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        color: '#F87171',
        fontSize: 10,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <TrendingDown size={10} strokeWidth={2.8} />
      {Math.abs(delta)}
    </span>
  );
}

export default MovementIndicator;
