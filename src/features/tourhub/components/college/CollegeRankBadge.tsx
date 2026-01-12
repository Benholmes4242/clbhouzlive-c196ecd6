/**
 * CollegeRankBadge - Competitive signal showing college ranking
 * Small pill with glass background, optional crown for #1
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CollegeRankBadgeProps {
  rank: number;
  showCrown?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const CollegeRankBadge: React.FC<CollegeRankBadgeProps> = ({
  rank,
  showCrown = true,
  size = 'sm',
  className,
}) => {
  const isTop10 = rank <= 10;
  const isFirst = rank === 1;

  return (
    <div
      className={cn(
        // Glass pill style
        'inline-flex items-center gap-0.5 rounded-sq-pill',
        'bg-white/90 dark:bg-white/15',
        'border border-border/30 dark:border-white/10',
        'backdrop-blur-sm',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
        // Top 10 gets orange accent
        isTop10 && 'border-brand-orange/40 bg-brand-orange/5',
        // Size variants
        size === 'sm' && 'px-1.5 py-0.5 text-[10px]',
        size === 'md' && 'px-2 py-1 text-xs',
        className
      )}
    >
      {/* Crown for #1 */}
      {isFirst && showCrown && (
        <span className="text-brand-orange" style={{ fontSize: size === 'sm' ? '8px' : '10px' }}>
          👑
        </span>
      )}
      
      <span className={cn(
        'font-semibold tabular-nums',
        isTop10 ? 'text-brand-orange' : 'text-foreground/80'
      )}>
        #{rank}
      </span>
    </div>
  );
};

export default CollegeRankBadge;
