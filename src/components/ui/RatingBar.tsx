import React from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingBar Component
 * 
 * NEW COLOR SYSTEM (Jan 2026):
 * - Fair → Excellent: All use slate (#64748B)
 * - Outstanding (9.0+): Uses gold (#D2B461)
 * 
 * The old green progression colors have been decommissioned.
 */

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** If true and value >= 9.0, uses gold fill instead of slate */
  showOutstandingGold?: boolean;
  /** Extra classes for width/margins etc. */
  className?: string;
}

export function RatingBar({
  value,
  max = 10,
  showOutstandingGold = true,
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  
  // UNIFIED COLOR SYSTEM: amber gradient for Outstanding (9.0+), gray-300 for rest
  // Matches breakdown bars in PersonalReviewCard, CommunityScoreCard, ReviewBlockFlat
  const isOutstanding = showOutstandingGold && value >= 9.0;

  return (
    <div
      className={cn(
        'relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
          isOutstanding 
            ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
            : 'bg-gray-300'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
