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

// Map band names to Global Colour System themes
const bandColors: Record<RatingBand, { bgLight: string; bgDark: string }> = {
  outstanding: { bgLight: COURSE_RATING_THEMES.OUTSTANDING.bgLight, bgDark: COURSE_RATING_THEMES.OUTSTANDING.bgDark },
  excellent: { bgLight: COURSE_RATING_THEMES.EXCELLENT.bgLight, bgDark: COURSE_RATING_THEMES.EXCELLENT.bgDark },
  veryGood: { bgLight: COURSE_RATING_THEMES.VERY_GOOD.bgLight, bgDark: COURSE_RATING_THEMES.VERY_GOOD.bgDark },
  good: { bgLight: COURSE_RATING_THEMES.GOOD.bgLight, bgDark: COURSE_RATING_THEMES.GOOD.bgDark },
  fair: { bgLight: COURSE_RATING_THEMES.FAIR.bgLight, bgDark: COURSE_RATING_THEMES.FAIR.bgDark },
};

// Track color - grey unfilled portion
const TRACK_COLOR = '#D7DDE3';
// Neutral fill - dark slate for non-banded bars
const NEUTRAL_FILL = '#1e293b';

export function RatingBar({
  value,
  max = 10,
  mode = 'neutral',
  band = 'veryGood',
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colors = bandColors[band];

  // TEST: All bars use the same dark slate fill to check if rendering is correct
  // Both neutral and banded modes use NEUTRAL_FILL
  const background = `linear-gradient(90deg, ${NEUTRAL_FILL} 0%, ${NEUTRAL_FILL} ${pct}%, ${TRACK_COLOR} ${pct}%, ${TRACK_COLOR} 100%)`;

  return (
    <div
      className={cn('h-2 w-full rounded-full', className)}
      style={{ background }}
    />
  );
}
