/**
 * AvatarXPRing - Premium avatar with animated tier-based achievement ring
 * Ring color derived from user's Top 100 courses played count
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { 
  getTierFromTop100Count, 
  RING_TOKENS, 
  hexToRgba,
  lightenHex,
  type AchievementRingTier 
} from '@/lib/achievementRingTokens';

interface AvatarXPRingProps {
  avatarUrl?: string;
  displayName: string;
  /** Top 100 courses played count - determines ring tier color */
  top100Count?: number;
  /** Legacy xpValue prop (ignored, kept for backwards compatibility) */
  xpValue?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  animateOnFirstView?: boolean;
  className?: string;
}

const SIZES = {
  sm: { avatar: 48, ring: 56, ringWidth: 3 },
  md: { avatar: 64, ring: 76, ringWidth: 3.5 },
  lg: { avatar: 88, ring: 104, ringWidth: 4 },
  xl: { avatar: 108, ring: 128, ringWidth: 4.5 },
};

// Tier-aware glow intensity multipliers
const GLOW_MULTIPLIER: Record<AchievementRingTier, number> = {
  NONE: 0,
  FAIR: 0.9,
  MILD: 1.0,
  STEADY: 1.05,
  RESPECTABLE: 1.1,
  GOOD: 1.15,
  VERY_GOOD: 1.2,
  EXCELLENT: 1.25,
  OUTSTANDING: 1.35,
};

export const AvatarXPRing: React.FC<AvatarXPRingProps> = ({
  avatarUrl,
  displayName,
  top100Count = 0,
  xpValue, // kept for backwards compat but unused
  size = 'lg',
  onClick,
  animateOnFirstView = true,
  className,
}) => {
  const [hasAnimated, setHasAnimated] = useState(!animateOnFirstView);
  const dimensions = SIZES[size];
  
  // Get tier-based ring colors from Top 100 count
  const tier = getTierFromTop100Count(top100Count);
  const tokens = RING_TOKENS[tier];
  const hasAchievement = tier !== 'NONE';
  const glowMultiplier = GLOW_MULTIPLIER[tier];

  useEffect(() => {
    if (animateOnFirstView && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateOnFirstView, hasAnimated]);

  // Multi-layer glow colors with tier-aware intensity
  const glowCore = hasAchievement ? hexToRgba(tokens.accent, 0.85 * glowMultiplier) : 'transparent';
  const glowMid = hasAchievement ? hexToRgba(tokens.accent, 0.55 * glowMultiplier) : 'transparent';
  const glowSoft = hasAchievement ? hexToRgba(tokens.accent, 0.35 * glowMultiplier) : 'transparent';
  
  // Compute a slightly brighter accent for the top of the gradient
  const accentBright = hasAchievement ? lightenHex(tokens.accent, 15) : '#D1D5DB';
  const ringBgDark = hasAchievement ? tokens.bgDark : '#D1D5DB';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      style={{
        width: dimensions.ring,
        height: dimensions.ring,
      }}
      aria-label={`${displayName}'s profile`}
    >
      {/* Outer glow halo (only for achievement tiers) */}
      {hasAchievement && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-14px',
            background: `radial-gradient(circle, ${glowSoft} 0%, transparent 65%)`,
            filter: 'blur(10px)',
            opacity: hasAnimated ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      )}

      {/* Ring border with gradient + multi-layer glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: dimensions.ringWidth / 2,
          background: hasAchievement 
            ? `linear-gradient(180deg, ${accentBright} 0%, ${ringBgDark} 100%)`
            : ringBgDark,
          padding: dimensions.ringWidth,
          boxShadow: hasAchievement 
            ? `0 0 0 4px rgba(0,0,0,0.7), 0 0 8px ${glowCore}, 0 0 18px ${glowMid}, 0 0 32px ${glowSoft}, 0 10px 30px rgba(0,0,0,0.5)`
            : `0 0 0 2px rgba(0,0,0,0.3)`,
          opacity: hasAnimated ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        {/* Inner dark circle (gap between ring and avatar) */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background: 'var(--dgp-bg-primary)',
          }}
        />
      </div>

      {/* Avatar */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: dimensions.avatar,
          height: dimensions.avatar,
        }}
      >
        <SquircleAvatar
          src={avatarUrl}
          alt={displayName}
          fallback={displayName.charAt(0).toUpperCase()}
          size={dimensions.avatar}
          hideRing
          className="w-full h-full"
        />
      </div>
    </button>
  );
};

export default AvatarXPRing;
