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

  useEffect(() => {
    if (animateOnFirstView && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateOnFirstView, hasAnimated]);

  // Default grey for users with no achievements
  const ringColor = hasAchievement ? tokens.accent : '#D1D5DB';
  const ringBgDark = hasAchievement ? tokens.bgDark : '#D1D5DB';
  const glowColor = hasAchievement ? hexToRgba(tokens.accent, 0.4) : 'transparent';

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
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(tokens.accent, 0.2)} 0%, transparent 70%)`,
            filter: 'blur(8px)',
            transform: 'scale(1.2)',
            opacity: hasAnimated ? 0.9 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />
      )}

      {/* Ring border with gradient */}
      <div
        className="absolute rounded-full"
        style={{
          inset: dimensions.ringWidth / 2,
          background: hasAchievement 
            ? `linear-gradient(180deg, ${tokens.accent} 0%, ${tokens.bgDark} 100%)`
            : ringColor,
          padding: dimensions.ringWidth,
          boxShadow: hasAchievement 
            ? `0 0 0 3px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3), 0 0 16px ${glowColor}`
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
