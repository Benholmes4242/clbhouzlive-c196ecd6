import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
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
      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-gray-900 group"
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

      {/* Bottom Overlay with User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <div className="liquid-glass rounded-xl p-3">
          <div className="flex flex-col space-y-3">
            {/* Display Name */}
            <h4 className="text-white font-semibold text-sm text-center truncate w-full leading-tight drop-shadow-sm">
              {user.displayName || user.username || 'User'}
            </h4>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              {/* Dismiss Button */}
              <button
                data-action-button
                onClick={handleDismissClick}
                disabled={isActionLoading}
                aria-label={`Dismiss ${user.displayName}`}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  "liquid-glass-button bg-white/10 hover:bg-white/20",
                  "border border-white/30",
                  isActionLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Follow Button */}
              <button
                data-action-button
                onClick={handleFollowClick}
                disabled={isActionLoading}
                aria-label={`${user.isFollowing ? 'Unfollow' : 'Follow'} ${user.displayName}`}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  user.isFollowing 
                    ? "liquid-glass-button following bg-white/10 text-white border border-white/30"
                    : "liquid-glass-button bg-white/90 hover:bg-white text-black border border-white/30",
                  isActionLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isActionLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : user.isFollowing ? (
                  <span className="text-xs font-medium">✓</span>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Direction Indicators */}
      {swipeState.isDragging && swipeState.progress > 0.3 && (
        <>
          {swipeState.direction === 'left' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                <X className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          {swipeState.direction === 'right' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SwipeableUserCard;