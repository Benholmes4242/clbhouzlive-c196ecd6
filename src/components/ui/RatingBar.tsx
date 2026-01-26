import React from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingBar Component
 * 
 * NEW COLOR SYSTEM (Jan 2026):
 * - Fair → Excellent: All use Emerald (#334E3D)
 * - Outstanding (9.0+): Uses Chartreus gold (#C1A84C)
 * 
 * The old gray/amber colors have been decommissioned.
 */

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** If true and value >= 9.0, uses gold fill instead of emerald */
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
  
  // UNIFIED COLOR SYSTEM: Chartreus for Outstanding (9.0+), Emerald for rest
  const isOutstanding = showOutstandingGold && value >= 9.0;

  return (
    <div
      className={cn(
        'relative w-full h-1.5 bg-[#e5e7eb] rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
          isOutstanding 
            ? 'bg-[#C1A84C]' 
            : 'bg-[#334E3D]'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
