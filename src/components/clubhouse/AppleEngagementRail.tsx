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
  const [showShareCheck, setShowShareCheck] = useState(false);

  const handleShare = () => {
    onShare();
    setShowShareCheck(true);
    setTimeout(() => setShowShareCheck(false), 2000);
  };

  return (
    <div 
      className={cn(
        'clubhouse-rail fixed right-[12px] z-50 flex flex-col items-center gap-3 px-1 py-2 glass-dark',
        className
      )}
      style={{
        width: GLASS_RAIL_WIDTH,
      }}
    >
      {/* Mute Button (video only) */}
      {isVideo && onMuteToggle && (
        <button
          type="button"
          onClick={onMuteToggle}
          className="flex items-center justify-center transition-transform active:scale-95"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          ) : (
            <Volume2 size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          )}
        </button>
      )}

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          className="flex items-center justify-center transition-transform active:scale-95"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            size={ICON_SIZE}
            className={cn('transition-all text-white', isLiked && 'fill-white')}
            style={{ display: 'block' }}
          />
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
          className="flex items-center justify-center transition-transform active:scale-95"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Comment"
        >
          <MessageCircle
            size={ICON_SIZE}
            className="text-white transition-colors"
            style={{ display: 'block' }}
          />
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
          className="flex items-center justify-center transition-transform active:scale-95"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Share"
        >
          {showShareCheck ? (
            <Check size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          ) : (
            <Share2 size={ICON_SIZE} className="text-white transition-colors" style={{ display: 'block' }} />
          )}
        </button>
        <span className="text-[11px] text-white/80 font-medium">
          {formatCount(stats.shares)}
        </span>
      </div>
    </div>
  );
};
