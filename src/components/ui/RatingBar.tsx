import React from 'react';
import { cn } from '@/lib/utils';
import { CLBHOUZ_ACHIEVEMENT_PALETTE } from '@/lib/clbhouzAchievementPalette';

export type RatingBand =
  | 'outstanding'
  | 'excellent'
  | 'veryGood'
  | 'good'
  | 'fair';

export type RatingBarMode = 'neutral' | 'banded';

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** neutral = dark slate, banded = band colour */
  mode?: RatingBarMode;
  /** Required when mode === 'banded' */
  band?: RatingBand;
  /** Extra classes for width/margins etc. */
  className?: string;
}

/**
 * Bar fill colors from CLBHOUZ_ACHIEVEMENT_PALETTE:
 * - Fair → #C1CFA1 (pale green)
 * - Good → #88B67B (fairway green)
 * - Very Good → #5B9E55 (strong green)
 * - Excellent → #3F7F41 (deep championship green)
 * - Outstanding → #D2B461 (warm trophy gold)
 */
const bandToFillColor: Record<RatingBand, string> = {
  fair: CLBHOUZ_ACHIEVEMENT_PALETTE.RESPECTABLE,
  good: CLBHOUZ_ACHIEVEMENT_PALETTE.GOOD,
  veryGood: CLBHOUZ_ACHIEVEMENT_PALETTE.VERY_GOOD,
  excellent: CLBHOUZ_ACHIEVEMENT_PALETTE.EXCELLENT,
  outstanding: CLBHOUZ_ACHIEVEMENT_PALETTE.OUTSTANDING,
};

export function RatingBar({
  value,
  max = 10,
  mode = 'neutral',
  band = 'veryGood',
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fillColor =
    mode === 'neutral'
      ? 'var(--rating-bar-fill-neutral)'
      : bandToFillColor[band];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{
        height: 'var(--rating-bar-height-sm)',
        backgroundColor: '#E8ECEF', // Lighter track for better contrast on white cards
        borderRadius: 'var(--rating-bar-radius)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: fillColor,
          borderRadius: 'var(--rating-bar-radius)',
        }}
      />
    </div>
  );
}
