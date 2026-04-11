import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { Squircle } from '@/components/ui/squircle';

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

  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
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
          "relative transition-all duration-200",
          "hover:opacity-80 active:scale-95",
          isPressed && "animate-bounce",
          className
        )}
        onClick={handlePress}
        style={{ minWidth: '48px', minHeight: '48px', padding: 0, border: 'none', background: 'transparent' }}
      >
        <Squircle width={48} height={48}>
          <div 
            className="w-full h-full flex items-center justify-center bg-hud-bg backdrop-blur-md border border-hud-border overflow-hidden relative"
            style={{ borderRadius: '30%' }}
          >
            {/* Ripple effect */}
            {isPressed && (
              <div 
                className="absolute inset-0 bg-white/20 animate-ping"
                style={{ animationDuration: '250ms', borderRadius: '30%' }}
              />
            )}
            
            <Icon 
              className={cn(
                "w-6 h-6 transition-colors duration-200 relative z-10",
                isActive ? "text-accent fill-accent" : "text-white"
              )}
            />
          </div>
        </Squircle>
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
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);

  if (!activePost) return null;

  return (
    <aside 
      data-control="action-rail"
      className={cn(
        "fixed right-4 z-30 flex flex-col items-center chrome-follow-bottom",
        gap
      )}
      style={{ 
        bottom: '97px',
        willChange: 'transform, opacity',
        transform: 'translateZ(0)'
      }}
    >
      {/* Only show audio control for video posts */}
      {activePost.isVideo && (
        <EngagementButton
          icon={isMuted ? VolumeX : Volume2}
          count={0}
          onClick={toggleMute}
          ariaLabel={isMuted ? 'Unmute' : 'Mute'}
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
