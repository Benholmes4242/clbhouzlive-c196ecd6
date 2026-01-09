import React from 'react';
import { Badge as BadgeType } from '@/types/badges';
import { EliteGameCard, EliteCardTier } from '@/components/achievements/EliteGameCard';

interface BadgeDisplayProps {
  badge: BadgeType;
  isEarned?: boolean;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Map badge criteria to tier
function getBadgeTier(badge: BadgeType): EliteCardTier {
  const value = badge.criteria_value;
  if (value <= 5) return '5';
  if (value <= 10) return '10';
  if (value <= 20) return '20';
  if (value <= 50) return '50';
  if (value <= 100) return '100';
  if (value <= 200) return '200';
  if (value <= 300) return '300';
  return '400';
}

/**
 * BadgeDisplay - Part of Global Achievement & Milestone System
 * Now wraps the unified EliteGameCard for consistent styling site-wide.
 */
const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  isEarned = false,
  progress = 0,
  showProgress = false,
  size = 'md',
  className
}) => {
  const tier = getBadgeTier(badge);

  return (
    <div className={className}>
      <EliteGameCard
        tier={tier}
        earned={isEarned}
        currentProgress={progress}
        targetProgress={badge.criteria_value}
        title={badge.display_name}
        subtitle={badge.description}
        compact={size === 'sm'}
      />
    </div>
  );
};

export default BadgeDisplay;
