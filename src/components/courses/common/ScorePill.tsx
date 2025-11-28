import React from 'react';
import { getRatingBand } from '@/utils/ratingBands';

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const band = getRatingBand(score);
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold rounded-full border uppercase'
      : 'px-4 py-1.5 text-sm font-semibold rounded-full border uppercase';

  return (
    <span
      className={`inline-flex items-center ${baseClasses}`}
      style={{
        backgroundColor: `${band.colorHex}15`,
        borderColor: `${band.colorHex}40`,
        color: band.colorHex,
      }}
    >
      {score.toFixed(1)} <span className="opacity-70">/10</span>
    </span>
  );
};
