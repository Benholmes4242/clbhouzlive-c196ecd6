import React from 'react';
import { reviewTierColor } from '@/components/shared/ReviewGhostScore';
import type { RatingTier } from '@/lib/ratingTier';
import { A } from '@/features/courses/components/holes/analytical/tokens';

// Shared by TheScore and the State 3/4 screen: restored by
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
  /** Signed-off small-sample chart: widths are shares, average tier is highlighted. */
  appearance?: 'default' | 'sample';
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
  activeTier,
  appearance = 'default',
}) => {
  const distributionItems = TIER_CONFIG.map(({ key, dataKey, label }) => ({
    key,
    label,
    count: distribution[dataKey],
  }));

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);
  const sample = appearance === 'sample';
  const denominator = sample ? Math.max(distributionItems.reduce((sum, item) => sum + item.count, 0), 1) : maxCount;

  return (
    <div data-distribution className="grid items-center gap-x-2 gap-y-2" style={{ gridTemplateColumns: 'max-content 1fr 24px' }}>
      {distributionItems.map((item) => {
        const percentage = (item.count / denominator) * 100;
        const bandFill = sample ? (item.key === activeTier ? A.IMPROVED : A.MUTE) : reviewTierColor(item.key as RatingTier, 'dark');

        return (
          <React.Fragment key={item.key}>
            <span className="text-[13px] text-muted-foreground">
              {item.label}
            </span>

            <div data-tier-track={item.key} className="flex-1 rounded-full overflow-hidden" style={{ background: A.TRACK, height: sample ? 10 : 8 }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  background: bandFill,

                }}
              />
            </div>


            <span data-tier-count={item.key} className="text-right text-xs text-muted-foreground tabular-nums">
              {item.count}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
