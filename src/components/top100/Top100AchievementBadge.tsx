import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

// Club name mapping (same source as AchievementBadgeCard)
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
 * Now wraps the unified AchievementBadgeCard for consistent styling site-wide.
 * This component is kept for backwards compatibility but delegates to AchievementBadgeCard.
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

  // Convert Top100TierId to AchievementTier
  const achievementTier = tierMeta.threshold.toString() as AchievementTier;
  const clubName = CLUB_NAMES[tierMeta.threshold] || `${tierMeta.threshold} Club`;

  return (
    <div className={className}>
      <AchievementBadgeCard
        tier={achievementTier}
        title={clubName}
        subtitle={tierMeta.tierName}
        unlocked={true}
        compact={size === 'compact'}
        totalTop100Played={totalTop100Played}
      />
    </div>
  );
}
