/**
 * AvatarXPRing - Premium avatar with animated tier-based achievement ring
 * Ring color derived from user's Top 100 courses played count
 * Uses global SDS squircle design: 34% border-radius, 1/1.05 aspect ratio
 * 
 * V1 Polish Pass:
 * - +6-8% larger avatar
 * - Depth shadow behind avatar
 * - Thicker ring with wider, softer glow
 * - 0.5px black gap between avatar and ring
 * - Calm motion: 220ms cubic-bezier(0.4, 0.0, 0.2, 1)
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
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

/**
 * SDS Avatar Squircle Constants
 * - Border radius: 34% creates continuous soft squircle curves
 * - Aspect ratio: 1/1.05 makes avatar slightly taller than wide
 */
const SDS_AVATAR_BORDER_RADIUS = '34%';
const SDS_AVATAR_ASPECT_RATIO = 1 / 1.05; // ≈0.952

// V1 Polish: +6-8% larger avatar sizes, thicker ring padding
const SIZES = {
  sm: { avatar: 52, ringPadding: 4, ringThickness: 3 },
  md: { avatar: 70, ringPadding: 5, ringThickness: 4 },
  lg: { avatar: 96, ringPadding: 6, ringThickness: 5 },
  xl: { avatar: 116, ringPadding: 7, ringThickness: 6 },
};

// Tier-aware glow intensity multipliers - reduced for softer ambient feel
const GLOW_MULTIPLIER: Record<AchievementRingTier, number> = {
  NONE: 0,
  FAIR: 0.6,
  MILD: 0.65,
  STEADY: 0.7,
  RESPECTABLE: 0.75,
  GOOD: 0.8,
  VERY_GOOD: 0.85,
  EXCELLENT: 0.9,
  OUTSTANDING: 1.0,
};

// V1 Polish: Calm motion easing
const POLISH_TRANSITION = 'all 220ms cubic-bezier(0.4, 0.0, 0.2, 1)';

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
  
  // Calculate ring dimensions maintaining squircle aspect ratio
  const ringWidth = dimensions.avatar + (dimensions.ringPadding * 2);
  const ringHeight = ringWidth / SDS_AVATAR_ASPECT_RATIO;
  const avatarHeight = dimensions.avatar / SDS_AVATAR_ASPECT_RATIO;
  
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

  // Multi-layer glow colors with reduced intensity for ambient feel
  const glowCore = hasAchievement ? hexToRgba(tokens.accent, 0.5 * glowMultiplier) : 'transparent';
  const glowMid = hasAchievement ? hexToRgba(tokens.accent, 0.35 * glowMultiplier) : 'transparent';
  const glowSoft = hasAchievement ? hexToRgba(tokens.accent, 0.2 * glowMultiplier) : 'transparent';
  
  // Compute a slightly brighter accent for the top of the gradient
  const accentBright = hasAchievement ? lightenHex(tokens.accent, 20) : '#D1D5DB';
  const ringBgDark = hasAchievement ? tokens.bgDark : '#D1D5DB';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        width: ringWidth,
        height: ringHeight,
        transition: POLISH_TRANSITION,
      }}
      aria-label={`${displayName}'s profile`}
    >
      {/* Outer glow halo - wider, softer, ambient */}
      {hasAchievement && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '-20px',
            borderRadius: SDS_AVATAR_BORDER_RADIUS,
            background: `radial-gradient(circle, ${glowSoft} 0%, transparent 70%)`,
            filter: 'blur(16px)',
            opacity: hasAnimated ? 0.8 : 0,
            transition: POLISH_TRANSITION,
          }}
        />
      )}

      {/* Achievement ring with gradient + wider glow - no hard edges */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: ringWidth,
          height: ringHeight,
          borderRadius: SDS_AVATAR_BORDER_RADIUS,
          background: hasAchievement 
            ? `linear-gradient(180deg, ${accentBright} 0%, ${ringBgDark} 100%)`
            : ringBgDark,
          boxShadow: hasAchievement 
            ? `0 0 12px ${glowCore}, 0 0 28px ${glowMid}, 0 0 48px ${glowSoft}`
            : 'none',
          opacity: hasAnimated ? 1 : 0,
          transition: POLISH_TRANSITION,
        }}
      />

      {/* Avatar with depth shadow and 0.5px black gap from ring */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: dimensions.avatar,
          height: avatarHeight,
          borderRadius: SDS_AVATAR_BORDER_RADIUS,
          // 0.5px black gap between avatar and ring
          outline: '0.5px solid rgba(0,0,0,0.6)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          transition: POLISH_TRANSITION,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            style={{ borderRadius: SDS_AVATAR_BORDER_RADIUS }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-semibold"
            style={{
              fontSize: `${Math.round(dimensions.avatar * 0.38)}px`,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </button>
  );
};

export default AvatarXPRing;
