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

const GLASS_RAIL_WIDTH = 34;  // Visible glass container
const BUTTON_SIZE = 26;       // Inner circle
const HIT_AREA = 44;          // Touch target
const ICON_SIZE = 18;         // Icon size

export const AppleEngagementRail = ({
  stats,
  isLiked = false,
  hasCommented = false,
  isVideo = false,
  isMuted = false,
  isActive = false,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  bottom,
  className
}: AppleEngagementRailProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showShareCheck, setShowShareCheck] = useState(false);

  // Stagger entrance when active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  const handleShare = () => {
    onShare();
    setShowShareCheck(true);
    setTimeout(() => setShowShareCheck(false), 2000);
  };

  return (
    <div 
      className={cn(
        'fixed z-50 flex flex-col items-center gap-3 px-1 py-2 glass-dark transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
        className
      )}
      style={{
        width: GLASS_RAIL_WIDTH,
        right: 12,
        bottom: bottom || 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height, 72px) + 16px)',
      }}
    >
      {/* Mute Button (video only) */}
      {isVideo && onMuteToggle && (
        <button
          type="button"
          onClick={onMuteToggle}
          className="flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              !isMuted && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            {isMuted ? (
              <VolumeX size={ICON_SIZE} className="text-white/80" style={{ display: 'block' }} />
            ) : (
              <Volume2 size={ICON_SIZE} className="text-white/80" style={{ display: 'block' }} />
            )}
          </div>
        </button>
      )}

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          className="flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              isLiked && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            <Heart
              size={ICON_SIZE}
              className={cn(
                'transition-all',
                isLiked ? 'fill-white text-white' : 'text-white/80'
              )}
              style={{ display: 'block' }}
            />
          </div>
        </button>
        <span className="text-[11px] text-white/80 font-medium">
          {formatCount(stats.likes)}
        </span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onComment}
          className="flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Comment"
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              hasCommented && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            <MessageCircle
              size={ICON_SIZE}
              className={cn(
                'transition-all',
                hasCommented ? 'fill-white text-white' : 'text-white/80'
              )}
              style={{ display: 'block' }}
            />
          </div>
        </button>
        <span className="text-[11px] text-white/80 font-medium">
          {formatCount(stats.comments)}
        </span>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Share"
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            {showShareCheck ? (
              <Check size={ICON_SIZE} className="text-white" style={{ display: 'block' }} />
            ) : (
              <Share2 size={ICON_SIZE} className="text-white/80" style={{ display: 'block' }} />
            )}
          </div>
        </button>
        <span className="text-[11px] text-white/80 font-medium">
          {formatCount(stats.shares)}
        </span>
      </div>
    </div>
  );
};
