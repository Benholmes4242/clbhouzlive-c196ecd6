import { memo } from 'react';
import type { ImportanceTier } from '../types';

interface IntensityDotsProps {
  count: number;
  tier: ImportanceTier;
}

const tierColors: Record<ImportanceTier, string> = {
  critical: 'bg-red-500',
  significant: 'bg-amber-500',
  useful: 'bg-emerald-500',
};

export const IntensityDots = memo(function IntensityDots({ count, tier }: IntensityDotsProps) {
  const maxDots = 5;
  const activeColor = tierColors[tier];

  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: maxDots }).map((_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i < count ? activeColor : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
});
