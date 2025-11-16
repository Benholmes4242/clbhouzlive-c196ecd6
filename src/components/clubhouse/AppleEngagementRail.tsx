/**
 * AppleEngagementRail - Right-side frosted glass action rail
 * Part of the Apple-style Clubhouse redesign
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
      const timer = setTimeout(() => setIsVisible(true), 120);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  const handleComment = () => {
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(10);
    }
    onComment();
  };

  const handleShare = async () => {
    await onShare();
    setShowShareCheck(true);
    setTimeout(() => setShowShareCheck(false), 800);
  };

  return (
    <div 
      className={cn(
        'fixed right-4 z-[50] flex flex-col items-center gap-6 px-2 py-3 glass-panel transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(82px, var(--bottom-nav-height, 72px) + 22px, calc(var(--bottom-nav-height, 72px) + 22px)))',
      }}
    >
      {/* Like button */}
      <button
        className={cn(
          'rail-btn rail-btn--like',
          isLiked && 'bg-white/14 shadow-[0_0_16px_rgba(255,255,255,0.35)]'
        )}
        onClick={onLike}
        aria-label="Like this round"
      >
        <Heart
          className={cn(
            'rail-btn-icon w-5 h-5',
            isLiked ? 'fill-white text-white' : 'text-white/80'
          )}
        />
      </button>
      {stats.likes > 0 && (
        <span className="text-[11px] font-medium text-white/75 -mt-4">
          {formatCount(stats.likes)}
        </span>
      )}

      {/* Comment button */}
      <button 
        className="rail-btn rail-btn--comment" 
        onClick={handleComment}
        aria-label="Open comments"
      >
        <div className="relative">
          <MessageCircle className="rail-btn-icon w-5 h-5 text-white/80" />
          {hasCommented && (
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white/80" />
          )}
        </div>
      </button>
      {stats.comments > 0 && (
        <span className="text-[11px] font-medium text-white/75 -mt-4">
          {formatCount(stats.comments)}
        </span>
      )}

      {/* Share button */}
      <button 
        className="rail-btn rail-btn--share" 
        onClick={handleShare}
        aria-label="Share this round"
      >
        <div className="relative">
          <Share2 className="rail-btn-icon w-5 h-5 text-white/80" />
          {showShareCheck && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-[10px] text-black">
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>
      </button>
      {stats.shares > 0 && (
        <span className="text-[11px] font-medium text-white/75 -mt-4">
          {formatCount(stats.shares)}
        </span>
      )}

      {/* Mute/Unmute button (only for videos) */}
      {isVideo && onMuteToggle && (
        <button
          className="rail-btn mt-2"
          onClick={onMuteToggle}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="rail-btn-icon w-5 h-5 text-white/80" />
          ) : (
            <Volume2 className="rail-btn-icon w-5 h-5 text-white/80" />
          )}
        </button>
      )}
    </div>
  );
};
