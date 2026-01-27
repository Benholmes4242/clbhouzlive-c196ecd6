import React from 'react';

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

// Tier configuration with labels
const TIER_CONFIG: Array<{ key: RatingTierKey; dataKey: keyof RatingTierDistributionData; label: string }> = [
  { key: 'OUTSTANDING', dataKey: 'outstanding', label: 'Outstanding' },
  { key: 'EXCELLENT', dataKey: 'excellent', label: 'Excellent' },
  { key: 'VERY_GOOD', dataKey: 'veryGood', label: 'Very Good' },
  { key: 'GOOD', dataKey: 'good', label: 'Good' },
  { key: 'FAIR', dataKey: 'fair', label: 'Fair' },
];

// UNIFIED COLOR SYSTEM - Amber for Outstanding only, Gray for rest
const OUTSTANDING_COLOR = '#f59e0b'; // Amber-500
const NEUTRAL_COLOR = '#d1d5db';     // Gray-300 - matches slider bars
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
        const isOutstanding = item.key === 'OUTSTANDING';
        const hasCount = item.count > 0;
        
        // Bar color logic:
        // - Outstanding tier ALWAYS gets amber (when it has any count)
        // - All other tiers with counts get neutral grey
        // - Empty bars get light grey
        const barColor = isOutstanding && hasCount
          ? OUTSTANDING_COLOR 
          : hasCount 
            ? NEUTRAL_COLOR 
            : EMPTY_COLOR;

        return (
          <div key={item.key} className="flex items-center gap-2">
            {/* Label - consistent width */}
            <span className="w-[76px] text-[13px] text-slate-600 shrink-0">
              {item.label}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-[6px] bg-[#e5e7eb] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>

            {/* Count - tabular numerals for alignment */}
            <span className="w-6 text-right text-xs text-slate-500 tabular-nums shrink-0">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};