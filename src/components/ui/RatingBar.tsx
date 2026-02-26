import React from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingBar Component
 * 
 * NEW COLOR SYSTEM (Jan 2026):
 * - Fair → Excellent: All use Gray (#d1d5db)
 * - Outstanding (9.0+): Uses Amber gradient (#f59e0b → #fbbf24)
 * 
 * The old emerald/chartreus colors have been decommissioned.
 */

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** If true and value >= 9.0, uses amber gradient fill instead of gray */
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
  
  // UNIFIED COLOR SYSTEM: Amber gradient for Outstanding (9.0+), Gray for rest
  const isOutstanding = showOutstandingGold && value >= 9.0;

  return (
    <div
      className={cn(
        'relative w-full h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
          isOutstanding 
            ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]' 
            : 'bg-[#A8A29E]'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
