import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Score pill component using Global Colour System
 * Colors sourced from getScoreTier() → COURSE_RATING_THEMES
 */
export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const tierData = getScoreTier(score);
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold uppercase'
      : 'px-4 py-1.5 text-sm font-semibold uppercase';

  return (
    <span
      className={`inline-flex items-center rounded-sq-xs border text-slate-800 ${baseClasses}`}
      style={{
        background: `linear-gradient(145deg, ${tierData.bgLight}, ${tierData.bgDark})`,
        borderColor: tierData.bgDark,
      }}
    >
      {score === 10 ? '10' : score.toFixed(1)}
    </span>
  );
};
