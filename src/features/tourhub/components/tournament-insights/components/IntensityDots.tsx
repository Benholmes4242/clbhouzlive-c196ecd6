import { memo } from 'react';
import type { ImportanceTier } from '../types';

interface IntensityDotsProps {
  count: number;
  tier: ImportanceTier;
  size?: 'default' | 'small';
}

const tierColors: Record<ImportanceTier, string> = {
  critical: 'bg-red-500',
  significant: 'bg-amber-500',
  useful: 'bg-emerald-500',
};

export const IntensityDots = memo(function IntensityDots({ 
  count, 
  tier,
  size = 'default'
}: IntensityDotsProps) {
  const maxDots = 5;
  const activeColor = tierColors[tier];
  // Larger, more visible dots
  const dotSize = size === 'small' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="flex gap-1">
      {Array.from({ length: maxDots }).map((_, i) => (
        <span
          key={i}
          className={`${dotSize} rounded-full transition-colors ${
            i < count ? activeColor : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
});