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
          'text-slate-700 bg-white/90 backdrop-blur-md',
          'px-2 py-0.5 rounded-sq-xs',
          'border border-slate-300/70',
          'shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
          className
        )}
      >
        Top {rank <= 10 ? 10 : rank <= 25 ? 25 : 50} {regionLabel}
      </span>
    );
  }

  // Default variant - "#3 Global" style with strong legibility
  return (
    <span 
      className={cn(
        'inline-flex items-center text-[11px] font-semibold',
        'text-slate-800 bg-white/95 backdrop-blur-md',
        'px-2.5 py-1 rounded-sq-xs',
        'border border-slate-300/60',
        'shadow-[0_2px_6px_rgba(0,0,0,0.1)]',
        className
      )}
    >
      #{rank} {regionLabel}
    </span>
  );
}
