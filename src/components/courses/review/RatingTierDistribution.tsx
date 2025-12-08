import React from 'react';
import { getScoreTier } from '@/utils/getScoreTier';
import { RatingBar } from '@/components/ui/RatingBar';

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
}

/**
 * Shared Rating Tier Distribution Component
 * 
 * Displays Outstanding/Excellent/Very Good/Good/Fair bars with counts.
 * Used on both the About tab (CommunityScoreCard) and Reviews tab.
 * Colors are sourced from the Global Colour System via getScoreTier().
 */
export const RatingTierDistribution: React.FC<RatingTierDistributionProps> = ({
  distribution,
}) => {
  // Map distribution to tier items using Global Colour System
  const distributionItems = [
    { count: distribution.outstanding, tier: getScoreTier(9.5) },
    { count: distribution.excellent, tier: getScoreTier(8.5) },
    { count: distribution.veryGood, tier: getScoreTier(7.5) },
    { count: distribution.good, tier: getScoreTier(6.5) },
    { count: distribution.fair, tier: getScoreTier(5) },
  ];

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  return (
    <div className="space-y-1.5">
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        return (
          <div key={item.tier.tier} className="flex items-center gap-0">
            {/* Label */}
            <span className="w-24 text-sm text-slate-700">
              {item.tier.label}
            </span>

            {/* Bar */}
            <div className="flex-1">
              <RatingBar 
                value={percentage}
                max={100}
                mode="banded"
                band={item.tier.tier}
              />
            </div>

            {/* Count */}
            <span className="w-6 text-right text-xs text-slate-500">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
