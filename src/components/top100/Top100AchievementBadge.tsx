import React from 'react';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
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
  className 
}: Top100AchievementBadgeProps) {
  if (!tier || tier === 'none') return null;
  
  const tierMeta = TIER_BY_ID[tier];
  if (!tierMeta) return null;

  // Convert Top100TierId to AchievementTier
  const achievementTier = tierMeta.threshold.toString() as AchievementTier;

  return (
    <div className={className}>
      <AchievementBadgeCard
        tier={achievementTier}
        title={`${tierMeta.threshold} Club`}
        subtitle={tierMeta.tierName}
        unlocked={true}
      />
    </div>
  );
}
