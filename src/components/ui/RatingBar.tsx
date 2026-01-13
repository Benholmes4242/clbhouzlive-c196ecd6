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
  
  // UNIFIED COLOR SYSTEM: amber for Outstanding (9.0+), grey for rest
  const isOutstanding = showOutstandingGold && value >= 9.0;
  const fillColor = isOutstanding 
    ? '#f59e0b'  // amber-500
    : '#9ca3af'; // gray-400

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{
        height: 'var(--rating-bar-height-sm)',
        backgroundColor: '#f3f4f6', // gray-100
        borderRadius: 'var(--rating-bar-radius)',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: fillColor,
          borderRadius: 'var(--rating-bar-radius)',
        }}
      />
    </div>
  );
}
