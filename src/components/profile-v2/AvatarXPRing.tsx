/**
 * AvatarXPRing - Premium avatar with animated tier-based achievement ring
 * Ring color derived from user's Top 100 courses played count
 * Uses global SDS squircle design: 34% border-radius, 1/1.05 aspect ratio
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

// SDS squircle constants
const SQUIRCLE_BORDER_RADIUS = '34%';
const SQUIRCLE_ASPECT_RATIO = '1 / 1.05';

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

  // Calculate ring height with squircle aspect ratio (1.05x taller)
  const ringHeight = dimensions.ring * 1.05;
  const avatarHeight = dimensions.avatar * 1.05;

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
        height: ringHeight,
      }}
      aria-label={`${displayName}'s profile`}
    >
      {/* Outer glow halo (only for achievement tiers) - squircle shape */}
      {hasAchievement && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '-14px',
            borderRadius: SQUIRCLE_BORDER_RADIUS,
            background: `radial-gradient(circle, ${glowSoft} 0%, transparent 65%)`,
            filter: 'blur(10px)',
            opacity: hasAnimated ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      )}

      {/* Achievement ring with gradient + glow only - squircle shape */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          borderRadius: SQUIRCLE_BORDER_RADIUS,
          background: hasAchievement 
            ? `linear-gradient(180deg, ${accentBright} 0%, ${ringBgDark} 100%)`
            : ringBgDark,
          boxShadow: hasAchievement 
            ? `0 0 8px ${glowCore}, 0 0 18px ${glowMid}, 0 0 32px ${glowSoft}`
            : 'none',
          opacity: hasAnimated ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* Avatar with hairline separator - squircle shape */}
      <div
        className="absolute overflow-hidden"
        style={{
          width: dimensions.avatar,
          height: avatarHeight,
          borderRadius: SQUIRCLE_BORDER_RADIUS,
          boxShadow: '0 0 0 0.5px rgba(0, 0, 0, 0.9)',
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
