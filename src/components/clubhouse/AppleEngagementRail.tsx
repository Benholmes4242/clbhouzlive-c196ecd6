/**
 * AppleEngagementRail - Right-side frosted glass action rail
 * Part of the Apple-style Clubhouse redesign
 */

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppleEngagementRailProps {
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
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

const ActionButton = ({ 
  icon: Icon, 
  count, 
  isActive, 
  onClick,
  ariaLabel 
}: {
  icon: any;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-200 ease-out",
        isPressed && "scale-110"
      )}
    >
      <div 
        className={cn(
          "relative w-10 h-10 rounded-full flex items-center justify-center",
          "transition-all duration-200",
          isActive && "scale-110"
        )}
        style={{
          background: isActive ? 'rgba(110, 146, 119, 0.25)' : 'transparent',
        }}
      >
        <Icon 
          className={cn(
            "w-5 h-5 transition-all duration-200",
            isActive 
              ? "text-[#6e9277] fill-[#6e9277] stroke-[#6e9277]" 
              : "text-white/90"
          )}
          strokeWidth={isActive ? 0 : 2}
        />
        
        {/* Glow ring on active */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: '0 0 12px rgba(110, 146, 119, 0.4), inset 0 0 0 1px rgba(110, 146, 119, 0.3)',
            }}
          />
        )}
      </div>
      
      {count !== undefined && count > 0 && (
        <span className="text-[11px] font-medium text-white/75">
          {formatCount(count)}
        </span>
      )}
    </button>
  );
};

export const AppleEngagementRail = ({
  stats,
  isLiked = false,
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

  // Stagger entrance when active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 120);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <div 
      className={cn(
        "fixed right-4 z-[50] flex flex-col items-center gap-6 px-2 py-3 rounded-[20px] transition-all duration-300 ease-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(82px, var(--bottom-nav-height, 72px) + 22px, calc(var(--bottom-nav-height, 72px) + 22px)))',
        background: 'rgba(30,30,30,0.35)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Mute/Unmute - only for videos */}
      {isVideo && onMuteToggle && (
        <ActionButton
          icon={isMuted ? VolumeX : Volume2}
          onClick={onMuteToggle}
          ariaLabel={isMuted ? 'Unmute' : 'Mute'}
        />
      )}

      {/* Like */}
      <ActionButton
        icon={Heart}
        count={stats.likes}
        isActive={isLiked}
        onClick={onLike}
        ariaLabel={isLiked ? 'Unlike' : 'Like'}
      />

      {/* Comment */}
      <ActionButton
        icon={MessageCircle}
        count={stats.comments}
        onClick={onComment}
        ariaLabel="Comments"
      />

      {/* Share */}
      <ActionButton
        icon={Share2}
        count={stats.shares}
        onClick={onShare}
        ariaLabel="Share"
      />
    </div>
  );
};
