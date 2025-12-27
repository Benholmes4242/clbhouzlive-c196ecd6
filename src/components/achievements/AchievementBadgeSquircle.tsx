import React from 'react';
import { cn } from '@/lib/utils';
import { 
  MILESTONE_THEMES,
  type MilestoneTier,
} from '@/lib/globalAchievementMilestoneSystem';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { getEmblemPath } from '@/lib/achievementEmblems';

export type SquircleTier = '5' | '10' | '20' | '50' | '100' | '200' | '300' | '400';

/**
 * Get the tier accent color from CLBHOUZ_ACHIEVEMENT_PALETTE
 */
function getTierAccentColor(tier: string): string {
  const threshold = parseInt(tier, 10);
  if (!isNaN(threshold) && MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return '#94a3b8';
}

/**
 * Get the tier background colors from MILESTONE_THEMES
 */
function getTierBgColors(tier: string): { bgLight: string; bgDark: string } {
  const threshold = parseInt(tier, 10) as MilestoneTier;
  if (!isNaN(threshold) && MILESTONE_THEMES[threshold]) {
    const theme = MILESTONE_THEMES[threshold];
    return { bgLight: theme.bgLight, bgDark: theme.bgDark };
  }
  return { bgLight: 'hsl(210 20% 98%)', bgDark: 'hsl(210 15% 94%)' };
}

export interface AchievementBadgeSquircleProps {
  /** The milestone threshold: 5, 10, 20, 50, 100, 200, 300, 400 */
  tier: SquircleTier;
  /** Whether this milestone is unlocked */
  unlocked: boolean;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
  /** Size variant - default is 56px (14 * 4), compact is 48px */
  size?: 'default' | 'compact';
}

/**
 * AchievementBadgeSquircle - Compact squircle version of achievement badges
 * 
 * Part of Global Achievement & Milestone System
 * Uses unified colors from globalAchievementMilestoneSystem.ts
 * 
 * Features:
 * - SDS squircle shape (rounded-sq-md)
 * - Milestone number centered
 * - Subtle line art emblem watermark
 * - Tier accent border and background tint
 * - Locked state with reduced opacity
 */
export const AchievementBadgeSquircle: React.FC<AchievementBadgeSquircleProps> = ({
  tier,
  unlocked,
  onClick,
  className,
  size = 'default',
}) => {
  const threshold = parseInt(tier, 10);
  const emblemSrc = getEmblemPath(tier);
  const accentColor = getTierAccentColor(tier);
  const { bgLight, bgDark } = getTierBgColors(tier);
  const lockedColor = '#94a3b8';
  
  const sizeClasses = size === 'compact' 
    ? 'h-12 w-12' 
    : 'h-14 w-14';
    
  const fontSizeClass = size === 'compact'
    ? 'text-sm'
    : 'text-base';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'relative flex items-center justify-center rounded-sq-md overflow-hidden transition-all duration-150',
        sizeClasses,
        onClick && 'cursor-pointer active:scale-[0.97]',
        !onClick && 'cursor-default',
        className
      )}
      style={{
        background: unlocked 
          ? `linear-gradient(145deg, ${bgLight}, ${bgDark})`
          : 'hsl(210 20% 98%)',
        border: `2px solid ${unlocked ? accentColor : `${lockedColor}66`}`,
        boxShadow: unlocked 
          ? `0 2px 12px ${accentColor}20`
          : 'none',
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      {/* Background emblem watermark */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
          style={{ 
            opacity: unlocked ? 0.12 : 0.06,
            filter: 'brightness(0)',
          }}
        />
      )}
      
      {/* Milestone number */}
      <span 
        className={cn('font-semibold relative z-10', fontSizeClass)}
        style={{ 
          color: unlocked ? accentColor : lockedColor,
        }}
      >
        {threshold}
      </span>
    </button>
  );
};

export default AchievementBadgeSquircle;
