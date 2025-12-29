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
 * Uses the same simple pill style as the "Played" button - solid background,
 * border, and text in the tier's color.
 */
export function RatingBadge({ tierData, label, className }: RatingBadgeProps) {
  // Use the tier's bgLight for a saturated background (like Played button uses emerald-50)
  // and accent for text/border (like Played uses emerald-700)
  const bgColor = tierData.bgLight;
  const accentColor = tierData.accent;
  
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full border px-2.5 py-[4px] text-[11px] font-medium',
        'transition-colors',
        className
      )}
      style={{
        borderColor: accentColor,
        backgroundColor: bgColor,
        color: accentColor,
      }}
    >
      {label ?? tierData.label}
    </span>
  );
}
