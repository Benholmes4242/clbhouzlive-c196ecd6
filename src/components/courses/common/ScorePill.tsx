import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';
import { cn } from '@/lib/utils';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Score pill component
 * Uses slate blue scale for Excellent→Poor, amber for Exceptional (≥9.0).
 */
export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const tierData = getScoreTier(score);
  const isExceptional = tierData.isExceptional;
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]'
      : 'px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.08em]';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sq-sm border transition-colors',
        baseClasses,
        isExceptional 
          ? 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#d97706]'
          : ''
      )}
      style={!isExceptional ? {
        backgroundColor: `${tierData.accent}1A`,
        borderColor: `${tierData.accent}33`,
        color: tierData.accent,
      } : undefined}
    >
      {score === 10 ? '10' : score.toFixed(1)}
    </span>
  );
};
