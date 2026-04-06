/**
 * AppleEngagementRail - Dark glass action rail
 * Apple-level visual polish with premium interactions
 * 
 * Sizing:
 * - Outer container width: 44px (hit area)
 * - Inner glass rail: 34px (visible container)
 * - Inner circle: 26px (button visual)
 * - Icon: 18px
 */

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface AppleEngagementRailProps {
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  hasCommented?: boolean;
  isVideo?: boolean;
  isMuted?: boolean;
  isActive?: boolean;
  shouldAnimate?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle?: () => void;
  bottom?: string;
  className?: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const RAIL_BUTTON_SIZE = 50;   // visual glass container
const HIT_AREA = 56;           // touch target
const ICON_SIZE = 24;          // icon size

interface RailButtonProps {
  children: React.ReactNode;
  count?: number;
  onClick: () => void;
  ariaLabel: string;
}

const RailButton = ({ children, count, onClick, ariaLabel }: RailButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="flex flex-col items-center gap-1"
  >
    {/* Glass pill with press animation */}
    <div
      className="glass-dark rounded-full flex items-center justify-center transition-transform duration-motion-fast ease-standard hover:scale-[1.05] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      style={{
        width: RAIL_BUTTON_SIZE,
        height: RAIL_BUTTON_SIZE,
      }}
    >
      {children}
    </div>

    {typeof count === 'number' && (
      <span className="text-[11px] leading-none text-white/80 font-medium">
        {formatCount(count)}
      </span>
    )}
  </button>
);

const AppleEngagementRailBase = ({
  stats,
  isLiked = false,
  hasCommented = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  shouldAnimate = false,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  bottom,
  className
}: AppleEngagementRailProps) => {
  const [showShareCheck, setShowShareCheck] = useState(false);

  const handleShare = () => {
    onShare();
    setShowShareCheck(true);
    setTimeout(() => setShowShareCheck(false), 2000);
  };

  return (
    <div 
      className={cn(
        'clubhouse-rail fixed right-[12px] z-50 flex flex-col items-center gap-5',
        shouldAnimate && 'transition-all duration-motion-fast ease-out-soft',
        shouldAnimate && 'will-change-transform will-change-opacity',
        'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        isActive
          ? 'opacity-100 translate-y-0'
          : shouldAnimate
            ? 'opacity-0 translate-y-[3px]'
            : 'opacity-100 translate-y-0',
        !isActive && 'pointer-events-none',
        className
      )}
      data-active={isActive ? 'true' : 'false'}
    >
      {/* Mute Button (video only) */}
      {isVideo && onMuteToggle && (
        <RailButton
          onClick={onMuteToggle}
          ariaLabel={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <VolumeX size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          ) : (
            <Volume2 size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          )}
        </RailButton>
      )}

      {/* Like Button with pop animation */}
      <RailButton
        onClick={onLike}
        ariaLabel={isLiked ? 'Unlike' : 'Like'}
        count={stats.likes}
      >
        <div className={cn(
          'transition-transform duration-motion-fast ease-out-soft',
          isLiked && 'scale-110 motion-reduce:scale-100'
        )}>
          {isLiked ? (
            <span style={{ fontSize: ICON_SIZE, lineHeight: 1, display: 'block' }}>🧡</span>
          ) : (
            <Heart size={ICON_SIZE} className="transition-all text-white" style={{ display: 'block' }} />
          )}
        </div>
      </RailButton>

      {/* Comment Button */}
      <RailButton
        onClick={onComment}
        ariaLabel="Comment"
        count={stats.comments}
      >
        <MessageCircle
          size={ICON_SIZE}
          className="text-white transition-colors"
          style={{ display: 'block' }}
        />
      </RailButton>

      {/* Share Button */}
      <RailButton
        onClick={handleShare}
        ariaLabel="Share"
        count={stats.shares}
      >
        {showShareCheck ? (
          <Check size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
        ) : (
          <Share2 size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
        )}
      </RailButton>
    </div>
  );
};

export const AppleEngagementRail = React.memo(
  AppleEngagementRailBase,
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.shouldAnimate === next.shouldAnimate &&
      prev.isLiked === next.isLiked &&
      prev.stats.likes === next.stats.likes &&
      prev.stats.comments === next.stats.comments &&
      prev.stats.shares === next.stats.shares &&
      prev.isMuted === next.isMuted
    );
  }
);

AppleEngagementRail.displayName = 'AppleEngagementRail';
