import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import '@/styles/engagement-rail.css';

interface EngagementRailProps {
  postId: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  isVideo?: boolean; // New prop to indicate if current post is a video
  isActive?: boolean; // Wire to active post signal
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  className?: string;
  // Props for three dots menu (only for user's own posts)
  isOwnPost?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
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
    <div className="flex flex-col items-center gap-1 engagement-btn">
      <button
        data-action="engagement"
        aria-label={ariaLabel}
        className={cn(
          "relative w-10 h-10 rounded-full flex items-center justify-center",
          "bg-hud-bg backdrop-blur-md border border-hud-border",
          "text-white transition-all duration-200 overflow-hidden",
          "hover:bg-hud-bg/80 active:scale-95",
          isPressed && "animate-bounce",
          className
        )}
        onClick={handlePress}
        style={{ minWidth: '40px', minHeight: '40px' }}
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
            "w-5 h-5 transition-colors duration-200",
            isActive ? "text-accent fill-accent" : "text-white"
          )}
        />
      </button>
      
      {count > 0 && (
        <span className="text-white text-xs font-medium">
          {formatCount(count)}
        </span>
      )}
    </div>
  );
};

const EngagementRail = ({
  postId,
  stats,
  isLiked = false,
  isVideo = false,
  isActive = false,
  onLike,
  onComment,
  onShare,
  className,
  isOwnPost = false,
  onEdit,
  onDelete
}: EngagementRailProps) => {
  const isMobile = useIsMobile();
  const gap = isMobile ? 'gap-4' : 'gap-5'; // 16px mobile, 20px desktop
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const [railVisible, setRailVisible] = useState(false);

  const handleAudioToggle = () => {
    toggleGlobalMute();
  };

  // Stagger entrance when post becomes active with debounce
  useEffect(() => {
    let showTimeout: number | undefined;
    let hideTimeout: number | undefined;
    
    if (isActive) {
      // Clear any pending hide
      if (hideTimeout) clearTimeout(hideTimeout);
      // 120ms delay after post becomes active so video snap/seek finishes first
      showTimeout = window.setTimeout(() => setRailVisible(true), 120);
    } else {
      // Clear any pending show
      if (showTimeout) clearTimeout(showTimeout);
      // Small delay before hiding to prevent flicker
      hideTimeout = window.setTimeout(() => setRailVisible(false), 50);
    }
    
    return () => {
      if (showTimeout) clearTimeout(showTimeout);
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [isActive]);

  return (
    <div 
      data-control="action-rail"
      className={cn(
        "engagement-rail fixed right-4 z-30 flex flex-col items-center",
        gap,
        railVisible ? 'is-visible' : 'is-hidden',
        className
      )}
      style={{ bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 6px - var(--chrome-bottom-shift, 0px) + 12px)' }} // ~90px when visible, ~6px when hidden
    >
      {/* Three dots menu - only show for own posts */}
      {isOwnPost && onEdit && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex flex-col items-center gap-1 engagement-btn">
              <button
                aria-label="Post options"
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-hud-bg backdrop-blur-md border border-hud-border",
                  "text-white transition-all duration-200 overflow-hidden",
                  "hover:bg-hud-bg/80 active:scale-95"
                )}
                style={{ minWidth: '40px', minHeight: '40px' }}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-48 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border border-white/10 shadow-xl z-[1000000]"
          >
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Only show audio control for video posts */}
      {isVideo && (
        <EngagementButton
          icon={isGloballyMuted ? VolumeX : Volume2}
          count={0}
          onClick={handleAudioToggle}
          ariaLabel={isGloballyMuted ? 'Unmute' : 'Mute'}
        />
      )}

      <EngagementButton
        icon={Heart}
        count={stats.likes}
        isActive={isLiked}
        onClick={onLike}
        ariaLabel={isLiked ? 'Unlike' : 'Like'}
      />
      
      <EngagementButton
        icon={MessageCircle}
        count={stats.comments}
        onClick={onComment}
        ariaLabel="Comments"
      />
      
      <EngagementButton
        icon={Share}
        count={stats.shares}
        onClick={onShare}
        ariaLabel="Share"
      />
    </div>
  );
};

export default EngagementRail;