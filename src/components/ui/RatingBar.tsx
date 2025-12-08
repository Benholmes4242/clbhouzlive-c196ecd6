import React from 'react';
import { cn } from '@/lib/utils';

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
 * Bar fill colors mapped to milestone club colors:
 * - Fair → 5 Club grey/slate
 * - Good → 10 Club blue-grey
 * - Very Good → 20 Club soft blue
 * - Excellent → 200 Club green
 * - Outstanding → 400 Club gold
 */
const bandToFillColor: Record<RatingBand, string> = {
  fair: '#9CA3AF',        // slate grey (5 Club tone)
  good: '#7B95BD',        // blue-grey (10 Club tone)
  veryGood: '#6BA3E0',    // brighter blue (20 Club tone)
  excellent: '#5DAF62',   // green (200 Club tone)
  outstanding: '#D4A857', // gold (400 Club tone)
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
        backgroundColor: 'var(--rating-bar-track)',
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
