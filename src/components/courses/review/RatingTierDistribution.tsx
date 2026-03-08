import React from 'react';
import { getRatingTheme } from '@/lib/globalAchievementMilestoneSystem';

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
  /** The active/highlighted tier (based on community average) */
  activeTier?: RatingTierKey;
}

// Tier configuration with labels and sample scores for color lookup
const TIER_CONFIG: Array<{ key: RatingTierKey; dataKey: keyof RatingTierDistributionData; label: string; sampleScore: number }> = [
  { key: 'OUTSTANDING', dataKey: 'outstanding', label: 'Outstanding', sampleScore: 9.5 },
  { key: 'EXCELLENT', dataKey: 'excellent', label: 'Excellent', sampleScore: 8.5 },
  { key: 'VERY_GOOD', dataKey: 'veryGood', label: 'Very Good', sampleScore: 7.5 },
  { key: 'GOOD', dataKey: 'good', label: 'Good', sampleScore: 6.5 },
  { key: 'FAIR', dataKey: 'fair', label: 'Fair', sampleScore: 5.0 },
];

const EMPTY_COLOR = '#f3f4f6';       // gray-100

/**
 * Simplified Rating Tier Distribution Component
 * 
 * Displays Outstanding/Excellent/Very Good/Good/Fair bars with counts.
 * 
 * Design rules:
 * - Outstanding tier ALWAYS uses Amber (regardless of count/dominance)
 * - All other tiers use Gray
 * - Empty bars use light grey
 * - Clean, calm hierarchy: Amber = exceptional, Gray = everything else
 */
export const RatingTierDistribution: React.FC<RatingTierDistributionProps> = ({
  distribution,
}) => {
  // Build distribution items
  const distributionItems = TIER_CONFIG.map(({ key, dataKey, label, sampleScore }) => ({
    key,
    label,
    count: distribution[dataKey],
    color: getRatingTheme(sampleScore).accent,
  }));

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  return (
    <div className="space-y-2">
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        const hasCount = item.count > 0;
        
        // Use per-tier color from the central theme system
        const barColor = hasCount ? item.color : EMPTY_COLOR;

        return (
          <div key={item.key} className="flex items-center gap-2">
            {/* Label - consistent width */}
            <span className="w-[76px] text-[13px] text-muted-foreground shrink-0">
              {item.label}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-[6px] bg-[#E7E5E4] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>

            {/* Count - tabular numerals for alignment */}
            <span className="w-6 text-right text-xs text-muted-foreground/60 tabular-nums shrink-0">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};