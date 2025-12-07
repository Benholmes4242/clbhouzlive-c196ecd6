import React from 'react';
import { cn } from '@/lib/utils';
import { COURSE_RATING_THEMES } from '@/lib/globalAchievementMilestoneSystem';

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
  /** Hide the track background, only show fill */
  hideTrack?: boolean;
  /** Extra classes for width/margins etc. */
  className?: string;
}

// Map band names to Global Colour System themes - use bgDark for bar fill (matches badge background)
const bandToFill: Record<RatingBand, string> = {
  outstanding: COURSE_RATING_THEMES.OUTSTANDING.bgDark,
  excellent: COURSE_RATING_THEMES.EXCELLENT.bgDark,
  veryGood: COURSE_RATING_THEMES.VERY_GOOD.bgDark,
  good: COURSE_RATING_THEMES.GOOD.bgDark,
  fair: COURSE_RATING_THEMES.FAIR.bgDark,
};

export function RatingBar({
  value,
  max = 10,
  mode = 'neutral',
  band = 'veryGood',
  hideTrack = false,
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fillColor =
    mode === 'neutral'
      ? 'var(--rating-bar-fill-neutral)'
      : bandToFill[band];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{
        height: 'var(--rating-bar-height-sm)',
        backgroundColor: hideTrack ? 'transparent' : 'var(--rating-bar-track)',
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
