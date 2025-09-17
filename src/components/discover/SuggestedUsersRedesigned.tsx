import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSuggestedUsersDiscover } from '@/hooks/useSuggestedUsersDiscover';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { toast } from 'sonner';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface SuggestedUserCardProps {
  user: {
    id: string;
    displayName: string;
    handle: string;
    isFollowing: boolean;
    latestVideo?: { url: string; poster?: string };
    latestPhoto?: { url: string };
    latestPostAt: string;
  };
  onToggleFollow: (userId: string) => Promise<boolean>;
  onDismiss: (userId: string) => void;
  isVisible: boolean;
}

const SuggestedUserCard: React.FC<SuggestedUserCardProps> = ({ 
  user, 
  onToggleFollow,
  onDismiss,
  isVisible 
}) => {
  const navigate = useNavigate();
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDismissLoading, setIsDismissLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Add swipe gesture support
  const swipeRef = useSwipeGesture({
    onSwipeUp: () => {
      if (!isFollowLoading) {
        handleFollowClick({ stopPropagation: () => {} } as React.MouseEvent);
      }
    },
    onSwipeDown: () => {
      if (!isDismissLoading) {
        handleDismissClick({ stopPropagation: () => {} } as React.MouseEvent);
      }
    },
    threshold: 50,
    preventDefaultTouchMove: true
  });

  // Handle video autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user.latestVideo) return;

    if (isVisible) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isVisible, user.latestVideo]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the follow button
    if ((e.target as HTMLElement).closest('[data-follow-button]')) {
      return;
    }
    navigate(`/profile/${user.id}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      const success = await onToggleFollow(user.id);
      if (success) {
        // Announce to screen readers
        const announcement = user.isFollowing ? `Unfollowed ${user.displayName}` : `Followed ${user.displayName}`;
        toast.success(announcement);
        
        // Analytics
        console.log('Analytics: suggestion_follow', { userId: user.id, action: user.isFollowing ? 'unfollow' : 'follow' });
      } else {
        toast.error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleDismissClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDismissLoading) return;
    
    setIsDismissLoading(true);
    try {
      onDismiss(user.id);
      toast.success(`Dismissed ${user.displayName}`);
      
      // Analytics
      console.log('Analytics: suggestion_dismiss', { userId: user.id });
    } catch (error) {
      console.error('Dismiss error:', error);
      toast.error('Failed to dismiss suggestion');
    } finally {
      setIsDismissLoading(false);
    }
  };

  const mediaUrl = user.latestVideo?.url || user.latestPhoto?.url;
  const isVideo = !!user.latestVideo;

  return (
    <div
      ref={swipeRef}
      className="relative overflow-hidden rounded-none snap-start aspect-[3/4] cursor-pointer bg-gray-900 group"
      onClick={handleCardClick}
    >
      {/* Media Content */}
      {mediaUrl ? (
        isVideo ? (
          <EnhancedVideoPlayer
            ref={videoRef}
            src={mediaUrl}
            poster={user.latestVideo?.poster}
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

      {/* Bottom Overlay with Controls */}
      <div className="
        absolute inset-x-0 bottom-0
        h-[clamp(64px,30%,96px)]
        bg-black/35 backdrop-blur-md
        rounded-none
        px-3 py-2 z-10
        flex items-center justify-center
      ">
        {/* Center - User Info */}
        <div className="flex flex-col items-center min-w-0">
          <span className="text-white font-medium truncate text-sm">
            {user.displayName || user.handle || 'User'}
          </span>
          <span className="text-white/80 text-xs">
            {user.isFollowing ? 'Following' : 'Follow'}
          </span>
        </div>
      </div>

      {/* Bottom Left - Dismiss */}
      <button 
        aria-label="Dismiss suggestion (swipe down)" 
        onClick={handleDismissClick}
        disabled={isDismissLoading}
        className="absolute bottom-2 left-2 group relative w-7 h-7 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white transition-all duration-200 hover:bg-red-500/30 z-20"
      >
        <FaThumbsDown className="w-3 h-3" />
        <span className="absolute -inset-1" />
      </button>

      {/* Bottom Right - Follow */}
      <button 
        aria-label="Follow user (swipe up)" 
        onClick={handleFollowClick}
        disabled={isFollowLoading}
        className="absolute bottom-2 right-2 group relative w-7 h-7 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white transition-all duration-200 hover:bg-green-500/30 z-20"
      >
        <FaThumbsUp className="w-3 h-3" />
        <span className="absolute -inset-1" />
      </button>
    </div>
  );
};

interface SuggestedUsersRedesignedProps {
  onUserFollow?: (userId: string) => void;
  onUserDismiss?: (userId: string) => void;
}

const SuggestedUsersRedesigned: React.FC<SuggestedUsersRedesignedProps> = ({ 
  onUserFollow,
  onUserDismiss 
}) => {
  const { users, loading, error, toggleFollow, refetch } = useSuggestedUsersDiscover();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for video autoplay
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = entry.target.getAttribute('data-card-id');
          if (!cardId) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setVisibleCards(prev => new Set([...prev, cardId]));
          } else {
            setVisibleCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(cardId);
              return newSet;
            });
          }
        });
      },
      {
        threshold: [0, 0.7, 1],
        rootMargin: '0px'
      }
    );

    const cards = container.querySelectorAll('[data-card-id]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [users]);

  const handleToggleFollow = async (userId: string) => {
    const success = await toggleFollow(userId);
    if (success && onUserFollow) {
      onUserFollow(userId);
    }
    return success;
  };

  const handleDismiss = (userId: string) => {
    if (onUserDismiss) {
      onUserDismiss(userId);
    }
  };

  if (loading) {
    return (
      <div className="pt-1 pb-6">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggested for you
            </h3>
          </div>
          
          <div className="flex overflow-x-auto scrollbar-hide gap-px pb-2">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="flex-shrink-0 w-40 aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-1 pb-6">
        <div className="md:container md:mx-auto md:px-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Suggested for you
            </h3>
            <button 
              onClick={refetch}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Retry
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="pt-1 pb-6">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Suggested for you
          </h3>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div 
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide gap-px pb-2"
        >
          {users.map((user) => (
            <div
              key={user.id}
              data-card-id={user.id}
              className="flex-shrink-0 w-40"
            >
              <SuggestedUserCard
                user={user}
                onToggleFollow={handleToggleFollow}
                onDismiss={handleDismiss}
                isVisible={visibleCards.has(user.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsersRedesigned;