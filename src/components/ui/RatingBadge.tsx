import React from 'react';
import { cn } from '@/lib/utils';
import { type ScoreTierData } from '@/utils/getScoreTier';

export type RatingBand =
  | 'outstanding'
  | 'excellent'
  | 'veryGood'
  | 'good'
  | 'respectable';

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
 * Colors are sourced from the Global Colour System via getScoreTier().
 * Text always uses dark slate (#0F172A) for consistency with milestone badges.
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
        color: '#0F172A', // Dark slate text - always
      }}
    >
      {label ?? tierData.label}
    </span>
  );
}
