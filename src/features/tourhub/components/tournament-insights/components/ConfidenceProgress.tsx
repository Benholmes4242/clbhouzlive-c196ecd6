import React from 'react';
import { ConfidenceTier } from '../types';

interface ConfidenceProgressProps {
  tier: ConfidenceTier;
  variant?: 'gold' | 'neutral';  // gold for #1 pick, neutral for runners-up
}

const tierToPercentage: Record<ConfidenceTier, number> = {
  elite: 92,
  high: 78,
  medium: 65,
};

const tierToLabel: Record<ConfidenceTier, string> = {
  elite: 'Elite',
  high: 'High',
  medium: 'Medium',
};

const ConfidenceProgress: React.FC<ConfidenceProgressProps> = ({ tier, variant = 'neutral' }) => {
  const percentage = tierToPercentage[tier];
  const isGold = variant === 'gold';

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          AI Confidence
        </span>
        <span className={`text-[13px] font-bold ${isGold ? 'text-amber-700' : 'text-slate-500'}`}>
          {percentage}%
        </span>
      </div>
      <div className={`h-1 rounded-full ${isGold ? 'bg-amber-100' : 'bg-slate-200'}`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isGold
              ? 'bg-gradient-to-r from-amber-700 to-amber-500'
              : 'bg-slate-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceProgress;
