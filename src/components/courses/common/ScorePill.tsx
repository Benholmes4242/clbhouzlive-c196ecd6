import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';
import { cn } from '@/lib/utils';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Score pill component
 * Uses gray styling for Fair→Excellent, amber only for Outstanding.
 * Matches RatingPill visual standard.
 */
export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const tierData = getScoreTier(score);
  const isOutstanding = tierData.tier === 'outstanding';
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]'
      : 'px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.08em]';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sq-sm border transition-colors',
        baseClasses,
        isOutstanding 
          ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#d97706]'
          : 'bg-[#A8A29E]/10 border-[#A8A29E]/20 text-[#78716C]'
      )}
    >
      {score === 10 ? '10' : score.toFixed(1)}
    </span>
  );
};
