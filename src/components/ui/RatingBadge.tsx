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

// Premium muted gold for Outstanding
const GOLD_BG_LIGHT = '#F5E6B8';
const GOLD_BG_DARK = '#D4B85A';

// Neutral grey for all other tiers
const NEUTRAL_BG_LIGHT = '#F1F5F9';
const NEUTRAL_BG_DARK = '#E2E8F0';

/**
 * Reusable rating badge component.
 * 
 * Design rules:
 * - Outstanding tier gets premium gold gradient
 * - All other tiers get neutral grey
 * - Text is always dark slate for consistency
 */
export function RatingBadge({ tierData, label, className }: RatingBadgeProps) {
  const isOutstanding = tierData.tier === 'outstanding';
  
  const bgLight = isOutstanding ? GOLD_BG_LIGHT : NEUTRAL_BG_LIGHT;
  const bgDark = isOutstanding ? GOLD_BG_DARK : NEUTRAL_BG_DARK;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        className
      )}
      style={{
        background: `linear-gradient(145deg, ${bgLight}, ${bgDark})`,
        color: '#0F172A', // Dark slate text - always
      }}
    >
      {label ?? tierData.label}
    </span>
  );
}