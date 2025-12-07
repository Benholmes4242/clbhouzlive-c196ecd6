import React from 'react';
import { cn } from '@/lib/utils';
import Top100TrophyIcon from '@/components/icons/Top100TrophyIcon';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';
import { getMilestoneAccent, type MilestoneTier } from '@/lib/globalAchievementMilestoneSystem';

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

/**
 * Top100AchievementBadge - Part of Global Achievement & Milestone System
 * 
 * A premium frosted glass squircle badge with tier-colored accents.
 * 
 * DESIGN RULES:
 * - Border and icon use pure accent color (same as avatar rings)
 * - Background is softened with color-mix for glass effect
 * - No opacity modifiers on border/icon - 100% solid accent
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

  // Get pure accent color from unified Global Achievement & Milestone System
  const accent = getMilestoneAccent(tierMeta.threshold as MilestoneTier);
  const isCompact = size === 'compact';

  // Background uses soft color-mix for glass effect, but border/icon stay pure
  const bgStart = `color-mix(in srgb, ${accent} 10%, white 90%)`;
  const bgEnd = `color-mix(in srgb, ${accent} 20%, white 80%)`;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap',
        'backdrop-blur-xl',
        isCompact ? 'px-3.5 py-1.5 gap-1.5' : 'px-4 py-2 gap-2',
        className
      )}
      style={{
        borderRadius: '999px',
        background: `linear-gradient(135deg, ${bgStart}, ${bgEnd})`,
        border: `1px solid ${accent}`, // Pure accent - same as avatar ring
        boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      {/* Trophy icon uses pure accent - same as avatar ring */}
      <Top100TrophyIcon
        className={cn(
          'shrink-0',
          isCompact ? 'h-4 w-4' : 'h-5 w-5'
        )}
        style={{ color: accent }}
      />
      <span
        className={cn(
          'font-semibold leading-tight',
          isCompact ? 'text-[13px]' : 'text-sm'
        )}
        style={{ color: accent }}
      >
        {tierMeta.tierName}
      </span>
    </div>
  );
}
