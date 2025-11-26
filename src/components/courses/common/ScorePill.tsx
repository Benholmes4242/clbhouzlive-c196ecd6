import React from 'react';

// Get rating variant from score
export const getRatingVariant = (score: number): 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding' => {
  if (score >= 9.0) return 'outstanding';
  if (score >= 8.0) return 'excellent';
  if (score >= 7.0) return 'veryGood';
  if (score >= 6.0) return 'good';
  return 'fair';
};

// Badge color mapping - using hex codes (same as Community Score)
const RATING_CHIP_COLORS = {
  fair: { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },        // slate-50/slate-500/slate-200
  good: { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' },        // sky-100/sky-600/sky-200
  veryGood: { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },    // blue-100/blue-600/blue-200
  excellent: { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' },   // emerald-100/emerald-600/emerald-200
  outstanding: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' }, // green-100/green-600/green-200
};

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const variant = getRatingVariant(score);
  const colors = RATING_CHIP_COLORS[variant];
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold rounded-full border'
      : 'px-4 py-1.5 text-sm font-semibold rounded-full border';

  return (
    <span
      className={`inline-flex items-center ${baseClasses}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {score.toFixed(1)} <span className="opacity-70">/10</span>
    </span>
  );
};
