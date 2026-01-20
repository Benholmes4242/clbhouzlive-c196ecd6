/**
 * AvatarXPRing - Premium avatar with animated tier-based achievement ring
 * Ring color derived from user's Top 100 courses played count
 * Uses global SDS squircle design: 34% border-radius, 1/1.05 aspect ratio
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { 
  getRingColorForTotalPlayed,
  getTierLevel,
  TIER_CONFIG,
  type TierLevel,
} from '@/lib/clbhouzAchievementPalette';

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
 * These match the global SquircleAvatar component spec
 */
const SDS_AVATAR_BORDER_RADIUS = '34%';
const SDS_AVATAR_ASPECT_RATIO = 1 / 1.05; // ≈0.952

const SIZES = {
  sm: { avatar: 48, ringPadding: 2 },
  md: { avatar: 64, ringPadding: 3 },
  lg: { avatar: 88, ringPadding: 4 },
  xl: { avatar: 108, ringPadding: 5 },
};

// Tier-aware glow intensity multipliers
const GLOW_MULTIPLIER: Record<TierLevel, number> = {
  0: 0,    // No tier
  1: 0.9,  // Rookie
  2: 1.0,  // Fairway
  3: 1.05, // Founders
  4: 1.1,  // Heritage
  5: 1.15, // Century
  6: 1.2,  // Elite
  7: 1.25, // Legendary
  8: 1.35, // Grand Slam
};

/**
 * Convert hex color to rgba with alpha
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color by a percentage (0-100)
 */
function lightenHex(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const lighten = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * (percent / 100)));
  
  const rNew = lighten(r).toString(16).padStart(2, '0');
  const gNew = lighten(g).toString(16).padStart(2, '0');
  const bNew = lighten(b).toString(16).padStart(2, '0');
  
  return `#${rNew}${gNew}${bNew}`;
}

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
  const tierLevel = getTierLevel(top100Count);
  const ringColor = getRingColorForTotalPlayed(top100Count);
  const hasAchievement = tierLevel > 0;
  const glowMultiplier = GLOW_MULTIPLIER[tierLevel];

  useEffect(() => {
    if (animateOnFirstView && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateOnFirstView, hasAnimated]);

  // Multi-layer glow colors with tier-aware intensity
  const glowCore = hasAchievement ? hexToRgba(ringColor, 0.85 * glowMultiplier) : 'transparent';
  const glowMid = hasAchievement ? hexToRgba(ringColor, 0.55 * glowMultiplier) : 'transparent';
  const glowSoft = hasAchievement ? hexToRgba(ringColor, 0.35 * glowMultiplier) : 'transparent';
  
  // Compute a slightly brighter accent for the top of the gradient
  const accentBright = hasAchievement ? lightenHex(ringColor, 15) : '#D1D5DB';
  const ringBgDark = ringColor;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center transition-transform duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      style={{
        width: ringWidth,
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
            borderRadius: SDS_AVATAR_BORDER_RADIUS,
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
          top: 0,
          left: 0,
          width: ringWidth,
          height: ringHeight,
          borderRadius: SDS_AVATAR_BORDER_RADIUS,
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

      {/* Avatar - directly positioned, no wrapper gap */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="absolute object-cover"
          style={{
            width: dimensions.avatar,
            height: avatarHeight,
            borderRadius: SDS_AVATAR_BORDER_RADIUS,
          }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center bg-muted text-muted-foreground font-semibold"
          style={{
            width: dimensions.avatar,
            height: avatarHeight,
            borderRadius: SDS_AVATAR_BORDER_RADIUS,
            fontSize: `${Math.round(dimensions.avatar * 0.38)}px`,
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </button>
  );
};

export default AvatarXPRing;
