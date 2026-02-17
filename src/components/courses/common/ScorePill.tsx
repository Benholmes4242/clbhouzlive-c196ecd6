import React from 'react';
import { cn } from '@/lib/utils';
import { courseDetailTokens } from '@/styles/course-detail-tokens';
import { getTierKeyFromScore } from '@/hooks/useTierStyles';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Score pill component — uses warm tier color progression.
 */
export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const tierKey = getTierKeyFromScore(score);
  const tier = courseDetailTokens.tiers[tierKey];
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]'
      : 'px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.08em]';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sq-sm border transition-colors',
        baseClasses,
        tier.bg,
        tier.border,
        tier.text,
      )}
    >
      {score === 10 ? '10' : score.toFixed(1)}
    </span>
  );
};
