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
  showOutstandingGold = false,
  className,
}: RatingBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  
  // New color system: slate for all, gold only for Outstanding (9.0+)
  const isOutstanding = showOutstandingGold && value >= 9.0;
  const fillColor = isOutstanding 
    ? 'var(--rating-bar-fill-outstanding)' 
    : 'var(--rating-bar-fill-neutral)';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        className
      )}
      style={{
        height: 'var(--rating-bar-height-sm)',
        backgroundColor: '#E8ECEF',
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
