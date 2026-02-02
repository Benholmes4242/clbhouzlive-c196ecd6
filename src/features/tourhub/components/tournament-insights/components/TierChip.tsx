import { memo } from 'react';
import type { ImportanceTier } from '../types';

interface TierChipProps {
  tier: ImportanceTier;
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

export const TierChip = memo(function TierChip({ tier }: TierChipProps) {
  const config = tierConfig[tier];

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
});
