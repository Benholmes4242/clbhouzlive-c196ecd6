import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface EngagementRailOverlayProps {
  activePost: {
    id: string;
    isLiked: boolean;
    likes: number;
    comments: number;
    shares: number;
    isVideo: boolean;
  } | null;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const EngagementButton = ({ 
  icon: Icon, 
  count, 
  isActive, 
  onClick, 
  className,
  ariaLabel
}: {
  icon: any;
  count: number;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel: string;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        data-action="engagement"
        aria-label={ariaLabel}
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center",
          "bg-hud-bg backdrop-blur-md border border-hud-border",
          "text-white transition-all duration-200 overflow-hidden",
          "hover:bg-hud-bg/80 active:scale-95",
          isPressed && "animate-bounce",
          className
        )}
        onClick={handlePress}
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        {/* Ripple effect */}
        {isPressed && (
          <div 
            className="absolute inset-0 bg-white/20 rounded-full animate-ping"
            style={{ animationDuration: '250ms' }}
          />
        )}
        
        <Icon 
          className={cn(
            "w-6 h-6 transition-colors duration-200",
            isActive ? "text-accent fill-accent" : "text-white"
          )}
        />
      </button>
      
      {count > 0 && (
        <span className="text-white text-xs font-medium transition-opacity duration-75">
          {formatCount(count)}
        </span>
      )}
    </div>
  );
};

export const EngagementRailOverlay: React.FC<EngagementRailOverlayProps> = ({
  activePost,
  onLike,
  onComment,
  onShare
}) => {
  const isMobile = useIsMobile();
  const gap = isMobile ? 'gap-4' : 'gap-5';
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  if (!activePost) return null;

  return (
    <aside 
      data-control="action-rail"
      className={cn(
        "fixed right-4 z-30 flex flex-col items-center chrome-follow-bottom",
        gap
      )}
      style={{ 
        bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 12px)',
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Only show audio control for video posts */}
      {activePost.isVideo && (
        <EngagementButton
          icon={isGloballyMuted ? VolumeX : Volume2}
          count={0}
          onClick={toggleGlobalMute}
          ariaLabel={isGloballyMuted ? 'Unmute' : 'Mute'}
        />
      )}

      <EngagementButton
        icon={Heart}
        count={activePost.likes}
        isActive={activePost.isLiked}
        onClick={onLike}
        ariaLabel={activePost.isLiked ? 'Unlike' : 'Like'}
      />
      
      <EngagementButton
        icon={MessageCircle}
        count={activePost.comments}
        onClick={onComment}
        ariaLabel="Comments"
      />
      
      <EngagementButton
        icon={Share}
        count={activePost.shares}
        onClick={onShare}
        ariaLabel="Share"
      />
    </aside>
  );
};
