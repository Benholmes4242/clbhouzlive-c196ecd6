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
  const fillStyle =
    mode === 'neutral'
      ? { backgroundColor: 'var(--rating-bar-fill-neutral)' }
      : { background: `linear-gradient(90deg, ${gradientColors.bgLight}, ${gradientColors.bgDark})` };

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
          ...fillStyle,
          borderRadius: 'var(--rating-bar-radius)',
        }}
      />
    </div>
  );
}
