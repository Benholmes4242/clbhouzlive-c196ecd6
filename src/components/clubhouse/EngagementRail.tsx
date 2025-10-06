import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface EngagementRailProps {
  postId: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  isVideo?: boolean; // New prop to indicate if current post is a video
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
  className 
}: {
  icon: any;
  count: number;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
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

  const handleAudioToggle = () => {
    toggleGlobalMute();
  };

  return (
    <div 
      className={cn(
        "fixed right-4 z-30 flex flex-col items-center",
        gap,
        className
      )}
      style={{ bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + 12px)' }}
    >
      {/* Three dots menu - only show for own posts */}
      {isOwnPost && onEdit && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex flex-col items-center gap-1">
              <button
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center",
                  "bg-hud-bg backdrop-blur-md border border-hud-border",
                  "text-white transition-all duration-200 overflow-hidden",
                  "hover:bg-hud-bg/80 active:scale-95"
                )}
                style={{ minWidth: '48px', minHeight: '48px' }}
              >
                <MoreHorizontal className="w-6 h-6 text-white" />
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
        />
      )}

      <EngagementButton
        icon={Heart}
        count={stats.likes}
        isActive={isLiked}
        onClick={onLike}
      />
      
      <EngagementButton
        icon={MessageCircle}
        count={stats.comments}
        onClick={onComment}
      />
      
      <EngagementButton
        icon={Share}
        count={stats.shares}
        onClick={onShare}
      />
    </div>
  );
};

export default EngagementRail;