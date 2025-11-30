import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const tierData = getScoreTier(score);
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold border uppercase'
      : 'px-4 py-1.5 text-sm font-semibold border uppercase';

  return (
    <span
      className={`inline-flex items-center ${baseClasses} ${tierData.bg} ${tierData.border} ${tierData.text}`}
      style={{ borderRadius: 'var(--radius)' }}
    >
      {score.toFixed(1)}
    </span>
  );
};
