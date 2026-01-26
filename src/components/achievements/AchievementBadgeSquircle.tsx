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

// Glow intensity by tier - boosted to match card collectible feel
// Base tier (Rookie → Century): visible glow presence
// High tier (Elite → Legendary): +1 step stronger
// Top tier (Grand Slam): strongest premium glow
const GLOW_INTENSITY: Record<string, { opacity: number; scale: number; blur: number }> = {
  '5': { opacity: 0.18, scale: 1.4, blur: 8 },
  '10': { opacity: 0.18, scale: 1.4, blur: 8 },
  '20': { opacity: 0.20, scale: 1.5, blur: 9 },
  '50': { opacity: 0.20, scale: 1.5, blur: 9 },
  '100': { opacity: 0.22, scale: 1.6, blur: 10 },
  '200': { opacity: 0.26, scale: 1.7, blur: 11 },
  '300': { opacity: 0.30, scale: 1.8, blur: 12 },
  '400': { opacity: 0.35, scale: 2.0, blur: 14 },
};

export interface AchievementBadgeSquircleProps {
  /** The milestone threshold: 5, 10, 20, 50, 100, 200, 300, 400 */
  tier: SquircleTier;
  /** Whether this milestone is unlocked */
  unlocked: boolean;
  /** Whether this is the current target milestone */
  isCurrentTarget?: boolean;
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
 * Collector / Rarity polish with same material language as AchievementBadgeCard:
 * 
 * Features:
 * - SDS squircle shape (rounded-sq-md)
 * - OPAQUE glass base (no transparency - rail cannot show through)
 * - Rarity glow behind number for unlocked milestones
 * - Corner accents (bottom-left + top-right) using tier colour
 * - Subtle inner highlight sheen at top edge
 * - Milestone number centered with premium styling
 * - Subtle line art emblem watermark (lighter than cards)
 * - Current target state with emphasized border + soft halo
 * - Locked state: neutral, muted, fully opaque
 */
export const AchievementBadgeSquircle: React.FC<AchievementBadgeSquircleProps> = ({
  tier,
  unlocked,
  isCurrentTarget = false,
  onClick,
  className,
  size = 'default',
}) => {
  const threshold = parseInt(tier, 10);
  const emblemSrc = getEmblemPath(tier);
  const accentColor = getTierAccentColor(tier);
  const lockedColor = '#B8C6C9';  // Sky Blue for locked state
  const displayColor = unlocked ? accentColor : lockedColor;
  const glowConfig = GLOW_INTENSITY[tier] || { opacity: 0.18, scale: 1.4, blur: 8 };
  
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
        // OPAQUE glass base - prevents rail from showing through
        // Using solid background with slight transparency for glass feel
        background: unlocked 
          ? 'var(--squircle-unlocked-bg, rgba(250, 250, 252, 0.95))'
          : 'var(--squircle-locked-bg, rgba(184, 198, 201, 0.08))',  // Sky Blue at 8%
        border: isCurrentTarget
          ? `2px solid ${accentColor}40`
          : `1px solid var(--achievement-card-border, rgba(184, 198, 201, 0.15))`,  // Sky Blue at 15%
        backdropFilter: 'blur(12px)',
        boxShadow: isCurrentTarget
          ? `0 0 12px ${accentColor}25, 0 2px 8px rgba(0, 0, 0, 0.04)`
          : unlocked 
            ? `0 2px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)`
            : '0 1px 4px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Top edge inner highlight sheen - Apple-style premium feel */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 20%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.6) 80%, transparent 100%)',
          opacity: 0.8,
        }}
      />

      {/* Bottom-left corner accent - soft glassy blob */}
      <div 
        className="absolute bottom-0 left-0 w-10 h-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at bottom left, ${displayColor}${unlocked ? '20' : '08'} 0%, transparent 70%)`,
          borderBottomLeftRadius: 'inherit',
        }}
      />

      {/* Top-right corner accent - lighter echo */}
      <div 
        className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${displayColor}${unlocked ? '12' : '05'} 0%, transparent 60%)`,
          borderTopRightRadius: 'inherit',
        }}
      />

      {/* Background emblem watermark - lighter than cards */}
      {emblemSrc && (
        <img
          src={emblemSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 w-full h-full object-cover"
          style={{ 
            opacity: unlocked ? 0.05 : 0.025,
            filter: 'brightness(0)',
          }}
        />
      )}

      {/* Rarity glow behind number - boosted for collectible token feel */}
      {unlocked && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}60 40%, transparent 70%)`,
              opacity: glowConfig.opacity,
              transform: `scale(${glowConfig.scale})`,
              filter: `blur(${glowConfig.blur}px)`,
            }}
          />
        </div>
      )}

      {/* Current target pulse halo */}
      {isCurrentTarget && (
        <div 
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          }}
        />
      )}
      
      {/* Milestone number - premium styling */}
      <span 
        className={cn('font-semibold relative z-10 tracking-tight', fontSizeClass)}
        style={{ 
          color: displayColor,
          textShadow: unlocked ? `0 1px 3px ${displayColor}25` : 'none',
          opacity: unlocked ? 1 : 0.6,
        }}
      >
        {threshold}
      </span>
    </button>
  );
};

export default AchievementBadgeSquircle;
