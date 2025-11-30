import React from 'react';
import { cn } from '@/lib/utils';
import { ScoreTierData } from '@/utils/getScoreTier';

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
 * for consistent badge styling across the app
 */
export function RatingBadge({ tierData, label, className }: RatingBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        tierData.bg,
        tierData.text,
        className
      )}
    >
      {label ?? tierData.label}
    </span>
  );
}
