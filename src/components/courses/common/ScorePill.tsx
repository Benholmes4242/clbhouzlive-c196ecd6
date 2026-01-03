import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';
import { cn } from '@/lib/utils';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Score pill component
 * Uses slate styling for Fair→Excellent, gold only for Outstanding.
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
          ? 'bg-[#C9A94A]/15 border-[#C9A94A]/40 text-[#8B7635]'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      )}
    >
      {score === 10 ? '10' : score.toFixed(1)}
    </span>
  );
};
