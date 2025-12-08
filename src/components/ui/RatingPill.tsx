import React from 'react';
import { cn } from '@/lib/utils';
import { getRatingTheme, type RatingTier } from '@/lib/globalAchievementMilestoneSystem';

interface RatingPillProps {
  /** Rating score (0-10) OR a RatingTier key */
  score?: number;
  tier?: RatingTier;
  /** Optional override label */
  label?: string;
  /** Extra classes */
  className?: string;
}

/**
 * Unified Rating Pill Component
 * 
 * Uses the Global Colour System for consistent rating badge styling.
 * Colors are mapped from milestone club colors:
 * - Fair → 50 Club (Heritage)
 * - Good → 100 Club (Century)
 * - Very Good → 200 Club (Elite)
 * - Excellent → 300 Club (Legendary)
 * - Outstanding → 400 Club (Grand Slam)
 * 
 * @example
 * <RatingPill score={8.5} />
 * <RatingPill tier="EXCELLENT" label="Custom Label" />
 */
export function RatingPill({ score, tier, label, className }: RatingPillProps) {
  // Get theme from score or tier
  const theme = tier 
    ? getRatingTheme(
        tier === 'OUTSTANDING' ? 9.5 :
        tier === 'EXCELLENT' ? 8.5 :
        tier === 'VERY_GOOD' ? 7.5 :
        tier === 'GOOD' ? 6.5 :
        tier === 'FAIR' ? 5 :
        5
      )
    : getRatingTheme(score ?? 0);

  const displayLabel = label ?? theme.label;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${theme.bgLight}, ${theme.bgDark})`,
        color: '#0F172A', // Dark slate text - always
      }}
    >
      {displayLabel.toUpperCase()}
    </span>
  );
}
