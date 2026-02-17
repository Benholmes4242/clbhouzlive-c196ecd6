import React from 'react';
import { courseDetailTokens } from '@/styles/course-detail-tokens';
import { getTierKeyFromScore } from '@/hooks/useTierStyles';

export type RatingTierKey = 'OUTSTANDING' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR';

export interface RatingTierDistributionData {
  outstanding: number;
  excellent: number;
  veryGood: number;
  good: number;
  fair: number;
}

interface RatingTierDistributionProps {
  distribution: RatingTierDistributionData;
  activeTier?: RatingTierKey;
}

const TIER_CONFIG: Array<{ key: RatingTierKey; dataKey: keyof RatingTierDistributionData; label: string; midScore: number }> = [
  { key: 'OUTSTANDING', dataKey: 'outstanding', label: 'Outstanding', midScore: 9.5 },
  { key: 'EXCELLENT', dataKey: 'excellent', label: 'Excellent', midScore: 8.5 },
  { key: 'VERY_GOOD', dataKey: 'veryGood', label: 'Very Good', midScore: 7.5 },
  { key: 'GOOD', dataKey: 'good', label: 'Good', midScore: 6.5 },
  { key: 'FAIR', dataKey: 'fair', label: 'Fair', midScore: 4 },
];

const EMPTY_COLOR = '#f3f4f6'; // gray-100

/**
 * Rating Tier Distribution with warm color progression per tier.
 */
export const RatingTierDistribution: React.FC<RatingTierDistributionProps> = ({
  distribution,
}) => {
  const distributionItems = TIER_CONFIG.map(({ key, dataKey, label, midScore }) => ({
    key,
    label,
    count: distribution[dataKey],
    midScore,
  }));

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        const hasCount = item.count > 0;
        const tierKey = getTierKeyFromScore(item.midScore);
        const tier = courseDetailTokens.tiers[tierKey];

        return (
          <div key={item.key} className="flex items-center gap-2">
            <span className="w-[76px] text-[13px] text-slate-600 shrink-0">
              {item.label}
            </span>

            <div className="flex-1 h-[6px] bg-[#e5e7eb] rounded-full overflow-hidden">
              {hasCount ? (
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(to right, ${tier.barFrom}, ${tier.barTo})`,
                  }}
                />
              ) : (
                <div
                  className="h-full rounded-full"
                  style={{ width: '0%', backgroundColor: EMPTY_COLOR }}
                />
              )}
            </div>

            <span className="w-6 text-right text-xs text-slate-500 tabular-nums shrink-0">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
