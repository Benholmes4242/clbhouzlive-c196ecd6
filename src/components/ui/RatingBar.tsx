import React from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingBar Component
 * 
 * COLOR SYSTEM (Mar 2026):
 * - Fair: Slate-400 (#94a3b8)
 * - Good: Slate-500 (#64748b)
 * - Very Good: Slate-600 (#475569)
 * - Excellent: Slate-800 (#1e293b)
 * - Outstanding (9.0+): Amber gradient (#f59e0b → #fbbf24)
 * 
 * Track matches surrounding background (bg-muted).
 */

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** If true and value >= 9.0, uses amber gradient fill instead of slate */
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

  // All tiers now use amber gradient fill (unified rating system)
  const barFillClass = 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]';

  return (
    <div
      className={cn(
        'relative w-full h-1.5 bg-transparent rounded-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all duration-300',
          barFillClass
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
