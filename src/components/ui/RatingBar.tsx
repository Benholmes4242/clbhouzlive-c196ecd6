import React from 'react';
import { cn } from '@/lib/utils';
import { COURSE_RATING_THEMES, RATING_BAR_TRACK, type RatingTier } from '@/lib/globalAchievementMilestoneSystem';

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
  /** neutral = dark slate, banded = uses tier accent color */
  mode?: RatingBarMode;
  /** Required when mode === 'banded' */
  band?: RatingBand;
  /** Extra classes for width/margins etc. */
  className?: string;
}

// Map band names to rating tier keys
const bandToTierKey: Record<RatingBand, RatingTier> = {
  outstanding: 'OUTSTANDING',
  excellent: 'EXCELLENT',
  veryGood: 'VERY_GOOD',
  good: 'GOOD',
  fair: 'FAIR',
};

export function RatingBar({
  value,
  max = 10,
  mode = 'neutral',
  band = 'veryGood',
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  
  // Get fill styling based on mode
  const getFillStyle = () => {
    if (mode === 'neutral') {
      return { backgroundColor: 'var(--rating-bar-fill-neutral)' };
    }
    
    // Banded mode: use accent color from Unified Color Scale
    // NO opacity, NO blending - solid accent color
    const tierKey = bandToTierKey[band];
    const theme = COURSE_RATING_THEMES[tierKey];
    return {
      backgroundColor: theme.accent,
    };
  };

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{
        height: 'var(--rating-bar-height-sm)',
        backgroundColor: RATING_BAR_TRACK,
        borderRadius: 'var(--rating-bar-radius)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300"
        style={{
          width: `${pct}%`,
          ...getFillStyle(),
          borderRadius: 'var(--rating-bar-radius)',
        }}
      />
    </div>
  );
}
