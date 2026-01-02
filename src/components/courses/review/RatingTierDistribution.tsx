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

// Premium muted gold for Outstanding tier
const GOLD_COLOR = '#C9A94A';
// Neutral charcoal/slate for all other tiers
const NEUTRAL_COLOR = '#64748B';
// Light grey for inactive/empty bars
const INACTIVE_COLOR = '#E2E8F0';

/**
 * Simplified Rating Tier Distribution Component
 * 
 * Displays Outstanding/Excellent/Very Good/Good/Fair bars with counts.
 * 
 * Design rules:
 * - All bars use neutral charcoal/slate color
 * - Only Outstanding tier gets gold highlight when it's the active tier
 * - No rainbow colors, no per-tier colors
 * - Clean, calm hierarchy: Gold = exceptional, neutral = everything else
 */
export const RatingTierDistribution: React.FC<RatingTierDistributionProps> = ({
  distribution,
  activeTier,
}) => {
  // Build distribution items
  const distributionItems = TIER_CONFIG.map(({ key, dataKey, label }) => ({
    key,
    label,
    count: distribution[dataKey],
  }));

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  // Find which tier has the highest count (implicit active tier if not provided)
  const highestCountTier = distributionItems.reduce((prev, current) => 
    current.count > prev.count ? current : prev
  ).key;

  const effectiveActiveTier = activeTier || (distributionItems.find(d => d.key === highestCountTier)?.count > 0 ? highestCountTier : null);

  return (
    <div className="space-y-2">
      {distributionItems.map((item) => {
        const percentage = (item.count / maxCount) * 100;
        const isOutstandingAndActive = item.key === 'OUTSTANDING' && effectiveActiveTier === 'OUTSTANDING';
        const hasCount = item.count > 0;
        
        // Bar color logic:
        // - Outstanding tier gets gold when it's the active tier
        // - All other tiers with counts get neutral charcoal
        // - Empty bars get light grey
        const barColor = isOutstandingAndActive 
          ? GOLD_COLOR 
          : hasCount 
            ? NEUTRAL_COLOR 
            : INACTIVE_COLOR;

        return (
          <div key={item.key} className="flex items-center gap-2">
            {/* Label - consistent width */}
            <span className="w-[76px] text-[13px] text-slate-600 shrink-0">
              {item.label}
            </span>

            {/* Bar track */}
            <div className="flex-1 h-[6px] bg-slate-200/60 rounded-full overflow-hidden">
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