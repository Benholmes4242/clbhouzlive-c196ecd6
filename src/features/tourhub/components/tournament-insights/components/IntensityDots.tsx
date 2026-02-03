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
  const dotSize = size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const gap = size === 'small' ? 'gap-0.5' : 'gap-1';
  const margin = size === 'small' ? '' : 'mt-1';

  return (
    <div className={`flex ${gap} ${margin}`}>
      {Array.from({ length: maxDots }).map((_, i) => (
        <span
          key={i}
          className={`${dotSize} rounded-full ${
            i < count ? activeColor : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
});
