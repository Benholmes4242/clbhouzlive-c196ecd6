import { memo } from 'react';
import type { ImportanceTier } from '../types';

interface TierChipProps {
  tier: ImportanceTier;
  size?: 'default' | 'small';
}

const tierConfig: Record<ImportanceTier, { label: string; bg: string; text: string }> = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10',
    text: 'text-red-600',
  },
  significant: {
    label: 'Significant',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
  },
  useful: {
    label: 'Useful',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
  },
};

export const TierChip = memo(function TierChip({ tier, size = 'default' }: TierChipProps) {
  const config = tierConfig[tier];
  
  const sizeClasses = size === 'small' 
    ? 'px-1.5 py-0.5 text-[10px]' 
    : 'px-2 py-0.5 text-xs';

  return (
    <span className={`rounded-full font-medium whitespace-nowrap ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
});
