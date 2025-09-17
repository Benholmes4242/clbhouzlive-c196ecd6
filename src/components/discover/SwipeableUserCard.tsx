import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { useSwipeableCard } from '@/hooks/useSwipeableCard';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import type { SuggestedUser } from '@/hooks/useSuggestionsQueue';

interface SwipeableUserCardProps {
  user: SuggestedUser;
  onFollow: (userId: string) => Promise<void>;
  onDismiss: (userId: string) => Promise<void>;
  isVisible: boolean;
}

const SwipeableUserCard: React.FC<SwipeableUserCardProps> = ({ 
  user, 
  onFollow,
  onDismiss,
  isVisible 
}) => {
  const navigate = useNavigate();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { bind, swipeState } = useSwipeableCard({
    onSwipeLeft: async () => {
      if (isActionLoading) return;
      setIsActionLoading(true);
      await onDismiss(user.id);
      setIsActionLoading(false);
    },
    onSwipeRight: async () => {
      if (isActionLoading) return;
      setIsActionLoading(true);
      await onFollow(user.id);
      setIsActionLoading(false);
    },
    threshold: 90,
    velocityThreshold: 0.3,
    lockAxis: 'x'
  });

  // Handle video autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user.previewMedia || user.previewMedia.type !== 'video') return;

    if (isVisible) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isVisible, user.previewMedia]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking action buttons or while dragging
    if ((e.target as HTMLElement).closest('[data-action-button]') || swipeState.isDragging) {
      return;
    }
    navigate(`/profile/${user.id}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActionLoading) return;
    
    setIsActionLoading(true);
    await onFollow(user.id);
    setIsActionLoading(false);
  };

  const handleDismissClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActionLoading) return;
    
    setIsActionLoading(true);
    await onDismiss(user.id);
    setIsActionLoading(false);
  };

  const mediaUrl = user.previewMedia?.url;
  const isVideo = user.previewMedia?.type === 'video';

  // Determine overlay color based on swipe direction
  const getOverlayColor = () => {
    if (!swipeState.isDragging || swipeState.progress < 0.2) return '';
    
    return swipeState.direction === 'right' 
      ? 'bg-green-500/20' 
      : 'bg-red-500/20';
  };

  return (
    <div
      {...bind}
      className="relative aspect-[3/4] rounded-none overflow-hidden cursor-pointer bg-gray-900 group"
      onClick={handleCardClick}
      style={{
        transform: swipeState.transform,
        transition: swipeState.isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {/* Media Content */}
      {mediaUrl ? (
        isVideo ? (
          <EnhancedVideoPlayer
            ref={videoRef}
            src={mediaUrl}
            poster={user.previewMedia?.poster}
            autoplay={false} // Controlled manually
            muted={true}
            loop={true}
            controls={false}
            className="w-full h-full"
            objectFit="cover"
            hideControls={true}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={`${user.displayName}'s post`}
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Swipe Overlay */}
      {swipeState.isDragging && (
        <div className={cn("absolute inset-0 transition-opacity", getOverlayColor())} />
      )}

      {/* Gradient Overlay for Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Liquid Glass Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-[clamp(64px,30%,96px)] bg-black/35 backdrop-blur-md rounded-none px-3 py-2 z-10 grid grid-cols-[auto_1fr_auto] items-center">
        {/* Left: Dismiss Button */}
        <button
          data-action-button
          onClick={handleDismissClick}
          disabled={isActionLoading}
          aria-label="Dismiss suggestion"
          className={cn(
            "group relative w-9 h-9 rounded-full flex items-center justify-center outline-none",
            "bg-red-500/15 hover:bg-red-500/25 text-white",
            "after:content-[''] after:absolute after:-inset-1",
            "transition-all duration-200 active:scale-90 hover:scale-105",
            isActionLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <FaThumbsDown className="w-4 h-4" />
          <span className="absolute -inset-1" />
        </button>

        {/* Center: User Info */}
        <div className="flex flex-col items-center min-w-0">
          <span className="text-white font-medium truncate">
            {user.displayName || user.username || 'User'}
          </span>
          {user.primaryClub && (
            <span className="text-white/70 text-xs truncate">
              {user.primaryClub}
            </span>
          )}
          <span className="text-white/80 text-xs">
            {user.isFollowing ? 'Following' : 'Follow'}
          </span>
        </div>

        {/* Right: Follow Button */}
        <button
          data-action-button
          onClick={handleFollowClick}
          disabled={isActionLoading}
          aria-label="Follow user"
          className={cn(
            "group relative w-9 h-9 rounded-full flex items-center justify-center outline-none",
            "bg-green-500/15 hover:bg-green-500/25 text-white",
            "after:content-[''] after:absolute after:-inset-1",
            "transition-all duration-200 active:scale-90 hover:scale-105",
            isActionLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isActionLoading ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaThumbsUp className="w-4 h-4" />
          )}
          <span className="absolute -inset-1" />
        </button>
      </div>

      {/* Swipe Direction Indicators */}
      {swipeState.isDragging && swipeState.progress > 0.3 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl",
              swipeState.direction === 'right' && "bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.6)]",
              swipeState.direction === 'left' && "bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            )}
          >
            {swipeState.direction === 'right' ? (
              <FaThumbsUp className="w-6 h-6 text-white" />
            ) : (
              <FaThumbsDown className="w-6 h-6 text-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeableUserCard;