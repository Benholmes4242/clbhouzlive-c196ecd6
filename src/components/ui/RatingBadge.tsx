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
 * Colors are sourced from the Masters Green Ladder via getScoreTier().
 * Uses gradient background from bgLight → bgDark with accent text.
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
        color: tierData.accent,
      }}
    >
      {label ?? tierData.label}
    </span>
  );
}
