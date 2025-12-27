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
 * Apple-level polish with same material language as AchievementBadgeCard:
 * 
 * Features:
 * - SDS squircle shape (rounded-sq-md)
 * - Neutral glass base (same as cards)
 * - Corner accents (bottom-left + top-right) using tier colour
 * - Subtle inner highlight sheen at top edge
 * - Milestone number centered with premium styling
 * - Subtle line art emblem watermark
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
  const lockedColor = '#94a3b8';
  const displayColor = unlocked ? accentColor : lockedColor;
  
  const sizeClasses = size === 'compact' 
    ? 'h-12 w-12' 
    : 'h-14 w-14';
    
  const fontSizeClass = size === 'compact'
    ? 'text-[13px]'
    : 'text-[15px]';

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
        // Same glass base as achievement cards
        background: 'var(--achievement-card-bg, rgba(31, 36, 40, 0.04))',
        border: `1px solid var(--achievement-card-border, rgba(31, 36, 40, 0.08))`,
        backdropFilter: 'blur(12px)',
        boxShadow: unlocked 
          ? `0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)`
          : '0 1px 4px rgba(0, 0, 0, 0.03)',
        opacity: unlocked ? 1 : 0.65,
      }}
    >
      {/* Top edge inner highlight sheen - Apple-style premium feel */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.5) 80%, transparent 100%)',
          opacity: 0.7,
        }}
      />

      {/* Bottom-left corner accent - soft glassy blob */}
      <div 
        className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at bottom left, ${displayColor}${unlocked ? '25' : '12'} 0%, transparent 70%)`,
          borderBottomLeftRadius: 'inherit',
        }}
      />

      {/* Top-right corner accent - lighter echo */}
      <div 
        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${displayColor}${unlocked ? '15' : '08'} 0%, transparent 60%)`,
          borderTopRightRadius: 'inherit',
        }}
      />

      {/* Background emblem watermark */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
          style={{ 
            opacity: unlocked ? 0.08 : 0.04,
            filter: 'brightness(0)',
          }}
        />
      )}
      
      {/* Milestone number - premium styling */}
      <span 
        className={cn('font-semibold relative z-10 tracking-tight', fontSizeClass)}
        style={{ 
          color: displayColor,
          textShadow: unlocked ? `0 1px 2px ${displayColor}20` : 'none',
        }}
      >
        {threshold}
      </span>
    </button>
  );
};

export default AchievementBadgeSquircle;
