import React from 'react';
import { cn } from '@/lib/utils';
import Top100TrophyIcon from '@/components/icons/Top100TrophyIcon';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { getRingColorForTotalPlayed, MILESTONE_THEMES } from '@/lib/globalAchievementMilestoneSystem';

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

/**
 * Top100AchievementBadge - Part of Global Achievement & Milestone System
 * 
 * A premium frosted glass squircle badge with tier-colored glass effect.
 * Colors sourced from globalAchievementMilestoneSystem.ts
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

  // Get color from unified Global Achievement & Milestone System (using softer ring color)
  const ringColor = MILESTONE_THEMES[tierMeta.threshold]?.ring ?? '#94a3b8';
  const isCompact = size === 'compact';

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-sq-sm border whitespace-nowrap',
        'backdrop-blur-xl',
        isCompact ? 'px-3.5 py-1.5 gap-1.5' : 'px-4 py-2 gap-2',
        className
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${ringColor} 15%, rgba(255,255,255,0.9)), color-mix(in srgb, ${ringColor} 20%, rgba(255,255,255,0.75)))`,
        borderColor: `color-mix(in srgb, ${ringColor} 35%, rgba(255,255,255,0.6))`,
        boxShadow: `0 4px 16px color-mix(in srgb, ${ringColor} 15%, rgba(0,0,0,0.08)), inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      <Top100TrophyIcon
        className={cn(
          'shrink-0',
          isCompact ? 'h-4 w-4' : 'h-5 w-5'
        )}
        style={{ color: ringColor }}
      />
      <span
        className={cn(
          'font-semibold leading-tight',
          isCompact ? 'text-[13px]' : 'text-sm'
        )}
        style={{ color: ringColor }}
      >
        {tierMeta.tierName}
      </span>
    </div>
  );
}
