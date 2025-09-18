import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSuggestedUsersDiscover } from '@/hooks/useSuggestedUsersDiscover';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { toast } from 'sonner';

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
  onDismiss: (userId: string) => Promise<void>;
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
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [dragY, setDragY] = useState(0);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    
    if (isFollowLoading || isDismissLoading) return;
    
    setIsFollowLoading(true);
    try {
      const success = await onToggleFollow(user.id);
      if (success) {
        toast.success(`Followed ${user.displayName}`);
        // Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'suggestion_follow', { method: 'tap' });
        }
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
    
    if (isDismissLoading || isFollowLoading) return;
    
    setIsDismissLoading(true);
    try {
      await onDismiss(user.id);
      toast.success(`Dismissed ${user.displayName}`);
      // Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'suggestion_dismiss', { method: 'tap' });
      }
    } catch (error) {
      console.error('Dismiss error:', error);
      toast.error('Failed to dismiss suggestion');
    } finally {
      setIsDismissLoading(false);
    }
  };

  const flashGlow = (dir: 'up' | 'down') => {
    setFlash(dir);
    setTimeout(() => setFlash(null), 350);
  };

  const handleSwipeUp = async () => {
    if (isFollowLoading || isDismissLoading || !isVertical) return;
    
    setSwipeDirection('up');
    setIsFollowLoading(true);
    flashGlow('up');
    
    try {
      const success = await onToggleFollow(user.id);
      if (success) {
        toast.success(`Followed ${user.displayName}`);
        // Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'suggestion_follow', { method: 'swipe_up' });
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    } finally {
      setIsFollowLoading(false);
      setSwipeDirection(null);
    }
  };

  const handleSwipeDown = async () => {
    if (isDismissLoading || isFollowLoading || !isVertical) return;
    
    setSwipeDirection('down');
    setIsDismissLoading(true);
    flashGlow('down');
    
    try {
      await onDismiss(user.id);
      toast.success(`Dismissed ${user.displayName}`);
      // Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'suggestion_dismiss', { method: 'swipe_down' });
      }
    } catch (error) {
      console.error('Dismiss error:', error);
      toast.error('Failed to dismiss suggestion');
    } finally {
      setIsDismissLoading(false);
      setSwipeDirection(null);
    }
  };

  const handleSwiping = (deltaX: number, deltaY: number) => {
    // Axis lock: engage vertical only when clearly vertical
    if (Math.abs(deltaY) > Math.abs(deltaX) + 12) {
      setIsVertical(true);
      setDragY(deltaY);
    } else {
      setIsVertical(false);
      setDragY(0);
    }
  };

  const handleSwipeEnd = () => {
    setDragY(0);
    setIsVertical(false);
  };

  // Swipe gesture hook
  const swipeRef = useSwipeGesture({
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    onSwiping: handleSwiping,
    onSwipeEnd: handleSwipeEnd,
    threshold: 90,
    preventDefaultTouchMove: false
  });

  const mediaUrl = user.latestVideo?.url || user.latestPhoto?.url;
  const isVideo = !!user.latestVideo;

  return (
    <motion.div
      ref={swipeRef}
      className="relative overflow-hidden rounded-none snap-start cursor-pointer bg-gray-900"
      onClick={handleCardClick}
      style={{
        transform: `translateY(${dragY * 0.05}px)`,
        opacity: dragY !== 0 ? Math.max(0.7, 1 - Math.abs(dragY) * 0.003) : 1,
        touchAction: 'pan-y'
      }}
      animate={{
        scale: swipeDirection ? 0.95 : 1
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Media Content */}
      {mediaUrl ? (
        isVideo ? (
          <EnhancedVideoPlayer
            ref={videoRef}
            src={mediaUrl}
            poster={user.latestVideo?.poster}
            autoplay={false}
            muted={true}
            loop={true}
            controls={false}
            className="w-full h-full aspect-[3/4]"
            objectFit="cover"
            hideControls={true}
          />
        ) : (
          <img
            src={mediaUrl}
            alt={`${user.displayName}'s post`}
            className="w-full h-full aspect-[3/4] object-cover"
          />
        )
      ) : (
        <div className="w-full h-full aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Swipe Direction Overlay */}
      {dragY !== 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            backgroundColor: dragY > 0 
              ? `rgba(239, 68, 68, ${Math.min(0.3, Math.abs(dragY) * 0.005)})` 
              : `rgba(34, 197, 94, ${Math.min(0.3, Math.abs(dragY) * 0.005)})`
          }}
        >
          {Math.abs(dragY) > 30 && (
            <div className={cn(
              "w-14 h-14 rounded-full text-white text-2xl flex items-center justify-center",
              dragY > 0 
                ? "bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.6)]" 
                : "bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.6)]"
            )}>
              {dragY > 0 ? <FaThumbsDown /> : <FaThumbsUp />}
            </div>
          )}
        </div>
      )}

      {/* Flash Feedback Bubble */}
      {flash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div
            className={cn(
              "w-14 h-14 rounded-full text-white text-2xl flex items-center justify-center animate-pingonce",
              flash === 'up'
                ? "bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.6)]"
                : "bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            )}
          >
            {flash === 'up' ? <FaThumbsUp /> : <FaThumbsDown />}
          </div>
        </div>
      )}

      {/* Swipe Feedback Bubble */}
      {swipeDirection && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "w-14 h-14 rounded-full text-white text-2xl flex items-center justify-center",
              swipeDirection === 'up'
                ? "bg-green-500 shadow-[0_0_20px_rgba(0,255,0,0.6)]"
                : "bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            )}
          >
            {swipeDirection === 'up' ? <FaThumbsUp /> : <FaThumbsDown />}
          </div>
        </div>
      )}

      {/* Liquid Glass Overlay */}
      <div className="
        absolute inset-x-0 bottom-0
        h-[clamp(64px,25%,92px)]
        bg-black/35 backdrop-blur-md
        rounded-none
        px-3 py-2 z-10
        grid grid-cols-[auto_1fr_auto] items-end
      ">
        {/* Left: Dismiss Button */}
        <motion.button
          aria-label="Dismiss suggestion"
          onClick={handleDismissClick}
          disabled={isDismissLoading || isFollowLoading}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="group relative w-8 h-8 rounded-full flex items-center justify-center
                     bg-white/15 hover:bg-white/25 text-white disabled:opacity-50"
        >
          <FaThumbsDown className="text-sm" />
          <span className="absolute -inset-1" />
          <span className="absolute inset-0 rounded-full pointer-events-none
                           scale-0 opacity-60
                           group-active:scale-150 group-active:opacity-0
                           transition-transform duration-300 bg-white/30" />
        </motion.button>

        {/* Center: User Info */}
        <div className="flex flex-col items-center min-w-0 mb-2">
          <span className="text-white font-medium truncate">
            {user.displayName || user.handle || 'User'}
          </span>
          <span className="text-white/80 text-xs">
            {user.isFollowing ? 'Following' : 'Follow'}
          </span>
        </div>

        {/* Right: Follow Button */}
        <motion.button
          aria-label="Follow user"
          onClick={handleFollowClick}
          disabled={isFollowLoading || isDismissLoading}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          className="group relative w-8 h-8 rounded-full flex items-center justify-center
                     bg-white/15 hover:bg-white/25 text-white disabled:opacity-50"
        >
          <FaThumbsUp className="text-sm" />
          <span className="absolute -inset-1" />
          <span className="absolute inset-0 rounded-full pointer-events-none
                           scale-0 opacity-60
                           group-active:scale-150 group-active:opacity-0
                           transition-transform duration-300 bg-white/30" />
        </motion.button>
      </div>
    </motion.div>
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
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleToggleFollow = async (userId: string) => {
    const success = await toggleFollow(userId);
    if (success && onUserFollow) {
      onUserFollow(userId);
    }
    return success;
  };

  const handleDismiss = async (userId: string) => {
    setDismissedUsers(prev => new Set([...prev, userId]));
    if (onUserDismiss) {
      onUserDismiss(userId);
    }
  };

  // Filter out dismissed users
  const filteredUsers = users.filter(user => !dismissedUsers.has(user.id));

  // Update scroll button visibility
  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  // Scroll function
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const cardWidth = 160; // Card width (w-40 = 160px)
      const scrollDistance = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
    }
  };

  // Set up scroll listener
  useEffect(() => {
    updateScrollButtons();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [filteredUsers.length]);

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

  if (filteredUsers.length === 0) {
    return null;
  }

  return (
    <div className="pt-1 pb-6">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 px-1 md:px-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Suggested for you
          </h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-12 w-12 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div 
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide gap-px pb-2"
          style={{ touchAction: 'pan-x' }}
        >
          {filteredUsers.map((user) => (
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