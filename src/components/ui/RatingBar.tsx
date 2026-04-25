import React from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingBar Component
 *
 * 5-TIER COLOR SYSTEM (Apr 2026):
 * - All tiers render with the unified amber gradient fill (#f59e0b → #fbbf24).
 * - Exceptional (≥9.0) is the canonical gold tier; the gradient is shared
 *   across tiers for visual consistency in compact bar contexts.
 *
 * Track matches surrounding background (bg-muted).
 */

interface RatingBarProps {
  /** Value to render, e.g. 8.3 */
  value: number;
  /** Max value (default 10) */
  max?: number;
  /** Reserved: when true and value ≥ 9.0, uses amber gradient fill. Currently
   *  all tiers use the amber gradient — flag retained for future variants. */
  showExceptionalGold?: boolean;
  /** Extra classes for width/margins etc. */
  className?: string;
}

export function RatingBar({
  value,
  max = 10,
  showExceptionalGold = true,
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
