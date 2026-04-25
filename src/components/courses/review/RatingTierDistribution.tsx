import React from 'react';

export type RatingTierKey = 'EXCEPTIONAL' | 'OUTSTANDING' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR';

export interface RatingTierDistributionData {
  exceptional: number;
  outstanding: number;
  excellent: number;
  veryGood: number;
  good: number;
  fair: number;
}

interface RatingTierDistributionProps {
  distribution: RatingTierDistributionData;
  /** The active/highlighted tier (based on community average) */
  activeTier?: RatingTierKey;
}

const TIER_CONFIG: Array<{ key: RatingTierKey; dataKey: keyof RatingTierDistributionData; label: string }> = [
  { key: 'EXCEPTIONAL', dataKey: 'exceptional', label: 'Exceptional' },
  { key: 'OUTSTANDING', dataKey: 'outstanding', label: 'Outstanding' },
  { key: 'EXCELLENT', dataKey: 'excellent', label: 'Excellent' },
  { key: 'VERY_GOOD', dataKey: 'veryGood', label: 'Very Good' },
  { key: 'GOOD', dataKey: 'good', label: 'Good' },
  { key: 'FAIR', dataKey: 'fair', label: 'Fair' },
];

export const RatingTierDistribution: React.FC<RatingTierDistributionProps> = ({
  distribution,
}) => {
  const distributionItems = TIER_CONFIG.map(({ key, dataKey, label }) => ({
    key,
    label,
    count: distribution[dataKey],
  }));

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        const hasCount = item.count > 0;

        return (
          <div key={item.key} className="flex items-center gap-2">
            <span className="w-[76px] text-[13px] text-muted-foreground shrink-0">
              {item.label}
            </span>

            <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  background: hasCount
                    ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                    : '#f3f4f6',
                }}
              />
            </div>

            <span className="w-6 text-right text-xs text-muted-foreground/60 tabular-nums shrink-0">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
