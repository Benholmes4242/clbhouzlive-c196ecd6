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
 * Uses slate styling for Fair→Excellent, gold only for Outstanding.
 * 
 * @example
 * <RatingPill score={8.5} />
 * <RatingPill tier="EXCELLENT" label="Custom Label" />
 */
export function RatingPill({ score, tier, label, className }: RatingPillProps) {
  // Get theme from score or tier (for label only)
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
  
  // Determine if Outstanding (gold) or standard (slate)
  const isOutstanding = theme.key === 'OUTSTANDING';

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        'border transition-colors',
        isOutstanding 
          ? 'bg-[#C9A94A]/15 border-[#C9A94A]/40 text-[#8B7635]'
          : 'bg-slate-100 border-slate-200 text-slate-600',
        className
      )}
    >
      {displayLabel.toUpperCase()}
    </span>
  );
}
