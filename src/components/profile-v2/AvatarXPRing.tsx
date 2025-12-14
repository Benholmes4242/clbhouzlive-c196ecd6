/**
 * AvatarXPRing - Premium avatar with animated XP tier ring
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getXPTier, XPTier } from './types';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface AvatarXPRingProps {
  avatarUrl?: string;
  displayName: string;
  xpValue: number;
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
  xpValue,
  size = 'lg',
  onClick,
  animateOnFirstView = true,
  className,
}) => {
  const [hasAnimated, setHasAnimated] = useState(!animateOnFirstView);
  const tierConfig = getXPTier(xpValue);
  const dimensions = SIZES[size];

  useEffect(() => {
    if (animateOnFirstView && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateOnFirstView, hasAnimated]);

  // Calculate ring progress (for potential future use)
  const getNextTierThreshold = () => {
    const tiers = [0, 10000, 20000, 30000, 40000, 50000];
    const nextTier = tiers.find(t => t > xpValue) ?? 50000;
    return nextTier;
  };

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
      {/* XP Ring - Outer glow layer */}
      <div
        className={cn(
          'absolute inset-0 rounded-full dgp-ring-animated',
          hasAnimated && 'dgp-ring-glow'
        )}
        style={{
          '--ring-color': tierConfig.glowColor,
          background: `conic-gradient(from 0deg, ${tierConfig.color}, ${tierConfig.color}80, ${tierConfig.color})`,
          opacity: hasAnimated ? 1 : 0,
          transition: 'opacity 0.6s ease',
        } as React.CSSProperties}
      />

      {/* Ring border */}
      <div
        className="absolute rounded-full"
        style={{
          inset: dimensions.ringWidth / 2,
          border: `${dimensions.ringWidth}px solid ${tierConfig.color}`,
          boxShadow: `0 0 16px ${tierConfig.glowColor}`,
        }}
      />

      {/* Inner dark circle (gap between ring and avatar) */}
      <div
        className="absolute rounded-full"
        style={{
          inset: dimensions.ringWidth + 2,
          background: 'var(--dgp-bg-primary)',
        }}
      />

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
          className="w-full h-full"
        />
      </div>
    </button>
  );
};

export default AvatarXPRing;
