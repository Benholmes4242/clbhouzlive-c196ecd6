import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Squircle } from '@/components/ui/squircle';
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
          "relative transition-all duration-200",
          "hover:opacity-80 active:scale-95",
          isPressed && "animate-bounce",
          className
        )}
        onClick={handlePress}
        style={{ minWidth: '40px', minHeight: '40px', padding: 0, border: 'none', background: 'transparent' }}
      >
        <Squircle width={40} height={40}>
          <div 
            className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-2xl overflow-hidden relative"
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
                "w-5 h-5 transition-colors duration-200 relative z-10",
                isActive ? "text-red-500 fill-red-500 stroke-red-500" : "text-white/90"
              )}
              strokeWidth={isActive ? 0 : 2}
            />
          </div>
        </Squircle>
      </button>
      
      <span className={cn(
        "text-white/90 text-xs font-medium",
        count === 0 && "invisible"
      )}>
        {count > 0 ? formatCount(count) : '0'}
      </span>
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
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore(s => s.markUserGestureUnmute);
  const [railVisible, setRailVisible] = useState(false);

  const handleAudioToggle = () => {
    if (isMuted) markUserGestureUnmute();
    toggleMute();
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
      style={{ 
        bottom: '97px' 
      }}
    >
      {/* Three dots menu - only show for own posts */}
      {isOwnPost && (onEdit || onDelete) && (
        <div className="flex flex-col items-center gap-1 engagement-btn">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Post options"
                className={cn(
                  "relative transition-all duration-200",
                  "hover:opacity-80 active:scale-95"
                )}
                style={{ minWidth: '40px', minHeight: '40px', padding: 0, border: 'none', background: 'transparent' }}
              >
                <Squircle width={40} height={40}>
                  <div 
                    className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-2xl overflow-hidden"
                    style={{ borderRadius: '30%' }}
                  >
                    <MoreHorizontal className="w-5 h-5 text-white/90" />
                  </div>
                </Squircle>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm border border-white/10 shadow-xl z-[1000000]"
            >
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Invisible count span to maintain consistent spacing */}
          <span className="text-white/90 text-xs font-medium invisible">0</span>
        </div>
      )}

      {/* Only show audio control for video posts */}
      {isVideo && (
        <EngagementButton
          icon={isMuted ? VolumeX : Volume2}
          count={0}
          onClick={handleAudioToggle}
          ariaLabel={isMuted ? 'Unmute' : 'Mute'}
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