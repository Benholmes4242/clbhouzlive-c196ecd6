import { memo } from 'react';
import type { ImportanceTier } from '../types';

interface TierChipProps {
  tier: ImportanceTier;
  size?: 'default' | 'small';
}

const tierConfig: Record<ImportanceTier, { label: string; classes: string }> = {
  critical: {
    label: 'Critical',
    classes: 'bg-red-50 text-red-600 border-red-100',
  },
  significant: {
    label: 'Significant',
    classes: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  useful: {
    label: 'Useful',
    classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
};

export const TierChip = memo(function TierChip({ tier, size = 'default' }: TierChipProps) {
  const config = tierConfig[tier];
  
  const sizeClasses = size === 'small' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span 
      className={`
        rounded-full font-semibold whitespace-nowrap border
        ${config.classes} ${sizeClasses}
      `}
    >
      {config.label}
    </span>
  );
});