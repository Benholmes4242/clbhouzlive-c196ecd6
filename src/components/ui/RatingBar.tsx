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
  /** Extra classes for width/margins etc. */
  className?: string;
}

// Map band names to Global Colour System themes (bgLight + bgDark for gradient)
const bandToGradient: Record<RatingBand, { bgLight: string; bgDark: string }> = {
  outstanding: { bgLight: COURSE_RATING_THEMES.OUTSTANDING.bgLight, bgDark: COURSE_RATING_THEMES.OUTSTANDING.bgDark },
  excellent: { bgLight: COURSE_RATING_THEMES.EXCELLENT.bgLight, bgDark: COURSE_RATING_THEMES.EXCELLENT.bgDark },
  veryGood: { bgLight: COURSE_RATING_THEMES.VERY_GOOD.bgLight, bgDark: COURSE_RATING_THEMES.VERY_GOOD.bgDark },
  good: { bgLight: COURSE_RATING_THEMES.GOOD.bgLight, bgDark: COURSE_RATING_THEMES.GOOD.bgDark },
  fair: { bgLight: COURSE_RATING_THEMES.FAIR.bgLight, bgDark: COURSE_RATING_THEMES.FAIR.bgDark },
};

export function RatingBar({
  value,
  max = 10,
  mode = 'neutral',
  band = 'veryGood',
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const gradientColors = bandToGradient[band];


  // Single gradient: solid fill (0→pct%) then track (pct%→100%)
  // Use bgDark as solid fill to match rating badge colors exactly
  const trackColor = '#D7DDE3';
  const background = mode === 'neutral'
    ? `linear-gradient(90deg, var(--rating-bar-fill-neutral) 0%, var(--rating-bar-fill-neutral) ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`
    : `linear-gradient(90deg, ${gradientColors.bgDark} 0%, ${gradientColors.bgDark} ${pct}%, ${trackColor} ${pct}%, ${trackColor} 100%)`;

  return (
    <div
      className={cn('h-2 w-full rounded-sq-full', className)}
      style={{ background }}
    />
  );
}
