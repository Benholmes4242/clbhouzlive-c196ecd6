import React from 'react';
import { cn } from '@/lib/utils';

interface CourseRankBadgeProps {
  rank: number;
  region?: 'global' | 'usa' | 'gb-i' | 'europe' | string;
  variant?: 'default' | 'flair';
  className?: string;
}

/**
 * COURSE RANK BADGE
 * 
 * Frosted white pill with soft shadow
 * Used on course cards for rank display
 * 
 * Variants:
 * - default: "#3 Global" style
 * - flair: "Top 10 Global" style (optional right-side badge)
 */
export function CourseRankBadge({ 
  rank, 
  region = 'global',
  variant = 'default',
  className 
}: CourseRankBadgeProps) {
  // Format region label
  const regionLabel = (() => {
    switch (region.toLowerCase()) {
      case 'global': return 'Global';
      case 'usa': return 'USA';
      case 'gb-i': 
      case 'gbi': return 'GB & Ireland';
      case 'europe': return 'Europe';
      default: return region;
    }
  })();

  if (variant === 'flair') {
    // Flair variant - "Top 10 Global" style
    return (
      <span 
        className={cn(
          'inline-flex items-center text-[10px] font-medium',
          'text-slate-700 bg-white/85 backdrop-blur-sm',
          'px-2 py-0.5 rounded-sq-xs',
          'border border-slate-200/60',
          'shadow-sm',
          className
        )}
      >
        Top {rank <= 10 ? 10 : rank <= 25 ? 25 : 50} {regionLabel}
      </span>
    );
  }

  // Default variant - "#3 Global" style
  return (
    <span 
      className={cn(
        'inline-flex items-center text-[11px] font-semibold',
        'text-slate-800 bg-white/90 backdrop-blur-sm',
        'px-2.5 py-1 rounded-sq-xs',
        'border border-slate-200/50',
        'shadow-sm',
        className
      )}
    >
      #{rank} {regionLabel}
    </span>
  );
}
