import React from 'react';
import { reviewTierColor } from '@/components/shared/ReviewGhostScore';
import type { RatingTier } from '@/lib/ratingTier';

// The Reviews tab header (TheScore) is its one live importer: restored by
// BRIEF_REVIEWS_HEADER_PAIR_AND_DISTRIBUTION. Empty bands render as the label,
// an empty track and a 0 — never hidden.
// Bar fill comes from the app-wide score bands via `reviewTierColor` — a flat
// band colour, not a gold/amber ramp.


export type RatingTierKey = 'EXCEPTIONAL' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface RatingTierDistributionData {
  exceptional: number;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

interface RatingTierDistributionProps {
  distribution: RatingTierDistributionData;
  /** The active/highlighted tier (based on community average) */
  activeTier?: RatingTierKey;
}

const TIER_CONFIG: Array<{ key: RatingTierKey; dataKey: keyof RatingTierDistributionData; label: string }> = [
  { key: 'EXCEPTIONAL', dataKey: 'exceptional', label: 'Exceptional' },
  { key: 'EXCELLENT', dataKey: 'excellent', label: 'Excellent' },
  { key: 'GOOD', dataKey: 'good', label: 'Good' },
  { key: 'FAIR', dataKey: 'fair', label: 'Fair' },
  { key: 'POOR', dataKey: 'poor', label: 'Poor' },
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
    <div className="grid items-center gap-x-2 gap-y-2" style={{ gridTemplateColumns: 'max-content 1fr 24px' }}>
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        const hasCount = item.count > 0;
        const bandFill = reviewTierColor(item.key as RatingTier, 'dark');

        return (
          <React.Fragment key={item.key}>
            <span className="text-[13px] text-muted-foreground">
              {item.label}
            </span>

            <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  background: hasCount ? bandFill : 'rgba(255,255,255,0.10)',

                }}
              />
            </div>


            <span className="text-right text-xs text-muted-foreground tabular-nums">
              {item.count}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
