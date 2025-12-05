import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Top100TierId } from '@/lib/top100Club';
import { TIER_BY_ID } from '@/lib/top100Club';

interface Top100AchievementBadgeProps {
  tier: Top100TierId | null;
  showSubtitle?: boolean;
  size?: 'default' | 'compact';
  className?: string;
}

/**
 * Top100AchievementBadge - SDS Squircle Glass style
 * 
 * A premium frosted glass squircle badge with tier-colored glass effect.
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

  const ringColor = tierMeta.ringColor;
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
      <div
        className={cn(
          'flex items-center justify-center rounded-sq-xs shrink-0',
          isCompact ? 'h-5 w-5' : 'h-6 w-6'
        )}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${ringColor} 60%, #ffffff), ${ringColor})`,
          boxShadow: `0 2px 6px color-mix(in srgb, ${ringColor} 30%, rgba(0,0,0,0.15))`,
        }}
      >
        <Trophy
          className="text-white"
          size={isCompact ? 12 : 14}
          strokeWidth={2.5}
        />
      </div>
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
