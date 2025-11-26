import React from 'react';

// Get rating variant from score - matches Community Score logic exactly
export const getRatingVariant = (score: number): 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding' => {
  if (score >= 9.0) return 'outstanding';
  if (score >= 8.0) return 'excellent';
  if (score >= 7.0) return 'veryGood';
  if (score >= 6.0) return 'good';
  return 'fair';
};

// Badge color mapping - MUST match Community Score exactly
const RATING_CHIP_COLORS = {
  fair:        { color: '#94A3B8' },  // neutral grey (0.0–5.9)
  good:        { color: '#64748B' },  // soft desaturated blue (6.0–6.9)
  veryGood:    { color: '#6EE7B7' },  // mid green (7.0–7.9)
  excellent:   { color: '#22C55E' },  // bright green (8.0–8.9)
  outstanding: { color: '#F4C15D' }   // gold (9.0–10.0)
};

interface ScorePillProps {
  score: number;
  size?: 'sm' | 'md';
}

export const ScorePill: React.FC<ScorePillProps> = ({ score, size = 'md' }) => {
  const variant = getRatingVariant(score);
  const { color } = RATING_CHIP_COLORS[variant];
  
  const baseClasses =
    size === 'sm'
      ? 'px-3 py-1 text-xs font-semibold rounded-full border uppercase'
      : 'px-4 py-1.5 text-sm font-semibold rounded-full border uppercase';

  return (
    <span
      className={`inline-flex items-center ${baseClasses}`}
      style={{
        backgroundColor: `${color}15`, // 15% opacity for background
        borderColor: `${color}40`,     // 40% opacity for border
        color: color
      }}
    >
      {score.toFixed(1)} <span className="opacity-70">/10</span>
    </span>
  );
};
