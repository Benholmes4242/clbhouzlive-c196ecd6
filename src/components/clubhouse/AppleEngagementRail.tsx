/**
 * AppleEngagementRail - Slimmer, dark glass action rail
 * Apple-level visual polish with premium interactions
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
  className?: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

const BUTTON_SIZE = 30;
const HIT_AREA = 44;

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
        right: 12,
        bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-height, 72px) + 22px)',
      }}
    >
      {/* Mute Button (video only) */}
      {isVideo && onMuteToggle && (
        <button
          type="button"
          onClick={onMuteToggle}
          className="rail-btn rail-btn--mute flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <div
            className={cn(
              'rail-btn-icon flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              !isMuted && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            {isMuted ? (
              <VolumeX className="w-[18px] h-[18px] text-white/80" />
            ) : (
              <Volume2 className="w-[18px] h-[18px] text-white/80" />
            )}
          </div>
        </button>
      )}

      {/* Like Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={onLike}
          className="rail-btn rail-btn--like flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <div
            className={cn(
              'rail-btn-icon flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              isLiked && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            <Heart
              className={cn(
                'w-[18px] h-[18px] transition-all',
                isLiked ? 'fill-white text-white' : 'text-white/80'
              )}
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
          className="rail-btn rail-btn--comment flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Comment"
        >
          <div
            className={cn(
              'rail-btn-icon flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10',
              hasCommented && 'bg-white/14'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            <MessageCircle className="w-[18px] h-[18px] text-white/80" />
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
          className="rail-btn rail-btn--share flex items-center justify-center"
          style={{ width: HIT_AREA, height: HIT_AREA }}
          aria-label="Share"
        >
          <div
            className={cn(
              'rail-btn-icon flex items-center justify-center rounded-full transition-all',
              'bg-black/30 border border-white/10'
            )}
            style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          >
            {showShareCheck ? (
              <Check className="w-[18px] h-[18px] text-white/80" />
            ) : (
              <Share2 className="w-[18px] h-[18px] text-white/80" />
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
