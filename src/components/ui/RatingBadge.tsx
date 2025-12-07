import React from 'react';
import { cn } from '@/lib/utils';
import { type ScoreTierData } from '@/utils/getScoreTier';

export type RatingBand =
  | 'outstanding'
  | 'excellent'
  | 'veryGood'
  | 'good'
  | 'fair';

interface RatingBadgeProps {
  /** Tier data from getScoreTier() */
  tierData: ScoreTierData;
  /** Optional override label */
  label?: string;
  /** Extra classes */
  className?: string;
}

/**
 * Reusable rating badge component that uses tier data from getScoreTier()
 * for consistent badge styling across the app.
 * 
 * Colors are sourced from the Unified Color Scale via getScoreTier().
 * Uses gradient background from bgLight → bgDark with accent text.
 * Text color automatically switches based on tier (dark for tiers < 100, white for ≥ 100).
 */
export function RatingBadge({ tierData, label, className }: RatingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${tierData.bgLight}, ${tierData.bgDark})`,
        color: tierData.textOnLight,
      }}
    >
      {label ?? tierData.label}
    </span>
  );
}
