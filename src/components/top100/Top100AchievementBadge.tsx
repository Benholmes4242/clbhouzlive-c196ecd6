import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { EliteGameCard, type EliteCardTier } from '@/components/achievements/EliteGameCard';

// Club name mapping
const CLUB_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
  /** Total Top 100 courses played - passed for "X CLUB" display */
  totalTop100Played?: number;
}

/**
 * Top100AchievementBadge - Part of Global Achievement & Milestone System
 * 
 * Now wraps the unified EliteGameCard for consistent styling site-wide.
 * This component is kept for backwards compatibility but delegates to EliteGameCard.
 */
export function Top100AchievementBadge({ 
  tier, 
  showSubtitle = true, 
  size = 'default',
  className,
  totalTop100Played,
}: Top100AchievementBadgeProps) {
  if (!tier || tier === 'none') return null;
  
  const tierMeta = TIER_BY_ID[tier];
  if (!tierMeta) return null;

  // Convert Top100TierId to EliteCardTier
  const eliteTier = tierMeta.threshold.toString() as EliteCardTier;
  const clubName = CLUB_NAMES[tierMeta.threshold] || `${tierMeta.threshold} Club`;

  return (
    <div className={className}>
      <EliteGameCard
        tier={eliteTier}
        earned={true}
        currentProgress={totalTop100Played}
        targetProgress={tierMeta.threshold}
        title={clubName}
        subtitle={showSubtitle ? tierMeta.tierName : undefined}
        compact={size === 'compact'}
        enableAnimations={false}
        quality={size === 'compact' ? 'low' : 'medium'}
      />
    </div>
  );
}
