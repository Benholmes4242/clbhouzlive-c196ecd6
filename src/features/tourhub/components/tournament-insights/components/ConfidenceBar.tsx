import { memo } from 'react';
import type { ConfidenceTier } from '../types';

interface ConfidenceBarProps {
  tier: ConfidenceTier;
  size?: 'default' | 'small';
}

const tierConfig: Record<ConfidenceTier, { segments: number; label: string }> = {
  elite: { segments: 5, label: 'Elite' },
  high: { segments: 4, label: 'High' },
  medium: { segments: 3, label: 'Medium' },
};

export const ConfidenceBar = memo(function ConfidenceBar({
  tier,
  size = 'default',
}: ConfidenceBarProps) {
  const config = tierConfig[tier];
  const maxSegments = 5;
  const barHeight = size === 'small' ? 'h-1' : 'h-1.5';

  return (
    <div className="flex items-center gap-2">
      {/* Segmented Bar */}
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: maxSegments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${barHeight} rounded-full ${
              i < config.segments ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      {size !== 'small' && (
        <span className="text-xs font-medium text-slate-500">{config.label}</span>
      )}
    </div>
  );
});
