import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { BiSolidDetail } from 'react-icons/bi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSuggestedUsersDiscover } from '@/hooks/useSuggestedUsersDiscover';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { toast } from 'sonner';
import { useMedia } from '@/hooks/useMedia';
import { useDiscoverOnboarding } from '@/hooks/useDiscoverOnboarding';
import { t } from '@/lib/i18n';
import { safePlay } from '@/utils/safePlay';

// Utility: ensures paint before heavy updates
const flushAnimationFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

interface SuggestedUserCardProps {
  user: {
    id: string;
    displayName: string;
    handle: string;
    isFollowing: boolean;
    profilePhotoUrl?: string;
    homeClub?: string;
    handicap?: number;
    latestVideo?: { url: string; poster?: string };
    latestPhoto?: { url: string };
    latestPostAt: string;
  };
  onToggleFollow: (userId: string) => Promise<boolean>;
  onDismiss: (userId: string) => Promise<void>;
  isVisible: boolean;
  onFirstSwipe?: () => void;
}

const SuggestedUserCard: React.FC<SuggestedUserCardProps> = ({ 
  user, 
  onToggleFollow,
  onDismiss,
  isVisible,
  onFirstSwipe
}) => {
  const navigate = useNavigate();
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isDismissLoading, setIsDismissLoading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);
  const [dragY, setDragY] = useState(0);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flashKey, setFlashKey] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const [hasSwipedOnce, setHasSwipedOnce] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'follow' | 'dismiss' | null>(null);
  const [isCardFading, setIsCardFading] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const FEEDBACK_MS = 1500;
  // Desktop vs mobile gating
  const isDesktop = useMedia('(min-width: 1024px)');
  const enableVerticalSwipe = !isDesktop;

  // DEBUG mount log per card
  useEffect(() => {
    console.debug('[SUG] mount card', { id: user.id, enableVerticalSwipe });
  }, []);
  
  // Handle video autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user.latestVideo) return;

    if (isVisible) {
      // Wrap in IIFE to handle async operations in useEffect
      (async () => {
        // Ensure attributes are set *before* attempting play
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        try {
          // Use robust utility that handles iOS, readyState, black-frame, retries
          const ok = await safePlay(video);
          if (!ok) {
            video.setAttribute('data-autoplay-blocked', '1');
          } else {
            video.removeAttribute('data-autoplay-blocked');
          }
        } catch (e) {
          console.warn('autoplay failed', e);
          video.setAttribute('data-autoplay-blocked', '1');
        }
      })();
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
    
    // Show feedback overlay
    setShowFeedback('follow');
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'suggestion_follow', { method: 'tap' });
    }
    
    // After feedback, fade card and then call API
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onToggleFollow(user.id), 300); // Fade duration
    }, FEEDBACK_MS);
  };

  const handleDismissClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDismissLoading || isFollowLoading) return;
    
    // Show feedback overlay
    setShowFeedback('dismiss');
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'suggestion_dismiss', { method: 'tap' });
    }
    
    // After feedback, fade card and then call API
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onDismiss(user.id), 300); // Fade duration
    }, FEEDBACK_MS);
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailExpanded(!isDetailExpanded);
  };

  // Local flash helper with remount to retrigger CSS
  const triggerFlash = useCallback((dir: 'up' | 'down') => {
    setFlashKey((k) => k + 1);
    setFlash(dir);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setFlash(null), 1500);
  }, []);

  const handleFirstSwipe = () => {
    if (!hasSwipedOnce && onFirstSwipe) {
      setHasSwipedOnce(true);
      onFirstSwipe();
    }
  };

  const handleSwipeUp = async () => {
    if (!enableVerticalSwipe) {
      console.debug('[SUG] blocked swipeUp: gate off', user.id);
      return;
    }
    console.debug('[SUG] swipeUp → flash', user.id);
    handleFirstSwipe();
    setSwipeDirection('up');
    triggerFlash('up');
    await flushAnimationFrame();
    
    // Show feedback overlay
    setShowFeedback('follow');
    
    // Hide the swipe direction after 1.5 seconds to match flash duration
    setTimeout(() => setSwipeDirection(null), FEEDBACK_MS);
    
    // After feedback, fade card and then call API
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onToggleFollow(user.id), 300); // Fade duration
    }, FEEDBACK_MS);
  };

  const handleSwipeDown = async () => {
    if (!enableVerticalSwipe) {
      console.debug('[SUG] blocked swipeDown: gate off', user.id);
      return;
    }
    console.debug('[SUG] swipeDown → flash', user.id);
    handleFirstSwipe();
    setSwipeDirection('down');
    triggerFlash('down');
    await flushAnimationFrame();
    
    // Show feedback overlay
    setShowFeedback('dismiss');
    
    // Hide the swipe direction after 1.5 seconds to match flash duration
    setTimeout(() => setSwipeDirection(null), FEEDBACK_MS);
    
    // After feedback, fade card and then call API
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onDismiss(user.id), 300); // Fade duration
    }, FEEDBACK_MS);
  };

  // Only update dragY for vertical gestures to prevent red circle on horizontal swipes
  const handleSwiping = (dx: number, dy: number) => {
    if (!enableVerticalSwipe) return;

    // Track "clearly vertical" movement
    const verticalCandidate = Math.abs(dy) > Math.abs(dx) + 14;
    setIsVertical(verticalCandidate);

    // Only update dragY for vertical movement to prevent red circle on horizontal carousel swipes
    if (verticalCandidate) {
      setDragY(dy);
    }
  };

  const handleSwipeEnd = () => {
    setDragY(0);
    setIsVertical(false);
  };

  // Attach swipe only if enabled
  const swipeRef = useSwipeGesture({
    onSwipeUp:    enableVerticalSwipe ? handleSwipeUp   : undefined,
    onSwipeDown:  enableVerticalSwipe ? handleSwipeDown : undefined,
    onSwiping:    enableVerticalSwipe ? handleSwiping   : undefined,
    onSwipeEnd:   handleSwipeEnd,
    threshold: 90,
    preventDefaultTouchMove: false,          // DO NOT block scroll
  });

  const mediaUrl = user.latestVideo?.url || user.latestPhoto?.url;
  const isVideo = !!user.latestVideo;

  return (
    <div
      ref={swipeRef}
      data-card={user.id}
      className="relative snap-start overflow-hidden"
      style={{ touchAction: 'auto' }}
    >
      <motion.div
        className="relative overflow-hidden rounded-none cursor-pointer bg-gray-900"
        onClick={handleCardClick}
        style={{
          transform: `translateY(${dragY * 0.05}px)`,
          opacity: isCardFading ? 0 : (dragY !== 0 ? Math.max(0.7, 1 - Math.abs(dragY) * 0.003) : 1)
        }}
        animate={{
          scale: swipeDirection ? 0.95 : 1,
          opacity: isCardFading ? 0 : 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          opacity: { duration: 0.3 }
        }}
    >
      {/* Media Content */}
      {mediaUrl ? (
        isVideo ? (
          <EnhancedVideoPlayer
            ref={videoRef}
            src={mediaUrl}
            poster={user.latestVideo?.poster}
            autoplay={true}
            playsInline={true}
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

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35 pointer-events-none" />


      {/* Edge-to-Edge Feedback Overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-xl px-6 py-3 border border-white/20 shadow-2xl w-full h-full flex items-center justify-center"
              initial={{ 
                opacity: 0, 
                scale: 0.9
              }}
              animate={{ 
                opacity: 1, 
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                duration: 0.4
              }}
            >
              <div className="flex flex-col items-center space-y-1">
                {/* Icon with glow */}
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center text-lg",
                  showFeedback === 'follow' 
                    ? "bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]" 
                    : "bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                )}>
                  {showFeedback === 'follow' ? '✅' : '❌'}
                </div>
                
                {/* Text */}
                <div className="text-white text-center font-medium text-sm">
                  {showFeedback === 'follow' 
                    ? `You've followed ${user.displayName}`
                    : `You've dismissed ${user.displayName}`
                  }
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Feedback Bubble - Remove duplicate since it's handled above */}


      {/* Detail Overlay - Animated */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-30"
        initial={false}
        animate={{
          height: isDetailExpanded ? "100%" : "clamp(64px,24%,80px)"
        }}
        transition={{
          duration: 0.35,
          ease: [0.25, 0.1, 0.25, 1] // ease-in-out
        }}
      >
        <div 
          className="relative w-full h-full backdrop-blur-md border-t border-white/20 rounded-none"
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
          }}
        >
          
          {/* Expanded Content - User Information */}
          <AnimatePresence>
            {isDetailExpanded && (
              <motion.div
                className="absolute inset-x-0 top-0 bottom-20 px-4 py-3 mt-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.1,
                  ease: "easeOut"
                }}
              >
                {/* User Avatar */}
                <div className="flex justify-center mb-2">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 group-hover:border-white/50 transition-all duration-300 group-hover:scale-110">
                    {/* XP Ring Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-white/10 blur-sm animate-pulse"></div>
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.displayName}
                        className="relative w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Name */}
                <motion.div
                  className="text-center mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <h3 className="text-white font-bold text-lg"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    {user.displayName}
                  </h3>
                </motion.div>

                {/* Home Golf Club */}
                {user.homeClub && (
                  <motion.div
                    className="text-center mb-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    <p className="text-white/80 text-sm font-medium opacity-80"
                       style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {user.homeClub}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enhanced Button Controls with glassmorphic container */}
          <div 
            className="absolute inset-x-0 bottom-0 px-3 py-2 backdrop-blur-md border-t border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              {/* Left: Dismiss Button */}
              <motion.button
                aria-label="Dismiss suggestion"
                onClick={handleDismissClick}
                disabled={isDismissLoading || isFollowLoading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="group relative w-10 h-10 rounded-full flex items-center justify-center
                           bg-white/10 backdrop-blur-sm border border-white/20 
                           hover:bg-white/20 active:scale-95 disabled:opacity-50
                           transition-all duration-200 overflow-hidden"
              >
                {/* Pulse animation on hover */}
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                             opacity-0 group-hover:opacity-30 transition-all duration-300" />
                
                {/* Ripple effect on tap */}
                <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                             opacity-0 group-active:opacity-50 transition-all duration-200" />
                
                <FaThumbsDown className="relative text-sm z-10" />
                <span className="absolute -inset-2" />
              </motion.button>

              {/* Center Detail Button */}
              <motion.button
                aria-label="View details"
                onClick={handleDetailClick}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className={cn(
                  "group relative w-10 h-10 rounded-full flex items-center justify-center text-white",
                  "bg-white/10 backdrop-blur-sm border border-white/20",
                  "hover:bg-white/20 active:scale-95 transition-all duration-200 overflow-hidden",
                  isDetailExpanded 
                    ? "bg-white/30 hover:bg-white/40" 
                    : "bg-white/15 hover:bg-white/25"
                )}
              >
                {/* Pulse animation on hover */}
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                             opacity-0 group-hover:opacity-30 transition-all duration-300" />
                
                {/* Ripple effect on tap */}
                <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                             opacity-0 group-active:opacity-50 transition-all duration-200" />
                
                <motion.div
                  className="relative z-10"
                  animate={{ rotate: isDetailExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BiSolidDetail className="text-sm fill-white" />
                </motion.div>
                <span className="absolute -inset-2" />
              </motion.button>

              {/* Right: Follow Button */}
              <motion.button
                aria-label="Follow user"
                onClick={handleFollowClick}
                disabled={isFollowLoading || isDismissLoading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="group relative w-10 h-10 rounded-full flex items-center justify-center
                           bg-white/10 backdrop-blur-sm border border-white/20 
                           hover:bg-white/20 active:scale-95 disabled:opacity-50
                           transition-all duration-200 overflow-hidden"
              >
                {/* Pulse animation on hover */}
                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                             opacity-0 group-hover:opacity-30 transition-all duration-300" />
                
                {/* Ripple effect on tap */}
                <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                             opacity-0 group-active:opacity-50 transition-all duration-200" />
                
                <FaThumbsUp className="relative text-sm z-10" />
                <span className="absolute -inset-2" />
              </motion.button>
            </div>
          </div>

          {/* Compact User Info - Only show when collapsed */}
          {!isDetailExpanded && (
            <motion.div
              className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 1 }}
              animate={{ opacity: isDetailExpanded ? 0 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-white font-semibold text-center text-sm whitespace-nowrap px-3 py-1 rounded-full backdrop-blur-sm"
                    style={{ 
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      background: 'rgba(255, 255, 255, 0.15)'
                    }}>
                {user.displayName || user.handle || "User"}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
      </motion.div>

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
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Detect mobile and onboarding
  const isDesktop = useMedia('(min-width: 1024px)');
  const isMobile = !isDesktop;
  const { show: showTutorial, dismiss: dismissTutorial } = useDiscoverOnboarding(isMobile);

  const handleToggleFollow = async (userId: string) => {
    const success = await toggleFollow(userId);
    if (success) {
      // Remove user from display after successful follow
      setDismissedUsers(prev => new Set([...prev, userId]));
      if (onUserFollow) {
        onUserFollow(userId);
      }
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
      // Update buttons after scroll completes
      setTimeout(updateScrollButtons, 300);
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

          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
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
        // Lower threshold ensures modest in-view portion triggers play
        threshold: [0, 0.3, 0.6, 1],
        // Small positive margin gives the video a head start before it's fully centered
        rootMargin: '25px 0px 25px 0px'
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
    <div className="pb-0 mb-0">
      <div className="md:container md:mx-auto md:px-0">
        {/* Section Header */}
        <div className="flex items-center justify-between my-0 py-0 px-1 md:px-0 mb-1">
          <h3 className="text-lg font-semibold leading-none my-0 text-gray-900 dark:text-white">
            Suggested for you
          </h3>
          <div className="flex gap-2">
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="h-6 w-6 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="h-6 w-6 p-0 hover:bg-transparent focus:outline-none focus:ring-0 focus:border-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div 
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide gap-px pb-0"
          style={{
            touchAction: 'pan-x',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                data-card-id={user.id}
                className="flex-shrink-0 w-40"
                layout
                initial={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -160, scale: 0.8 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  opacity: { duration: 0.2 },
                  x: { duration: 0.4 }
                }}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  const card = e.currentTarget;
                  const video = card.querySelector('video') as HTMLVideoElement;
                  if (!video) return;
                  if (video.getAttribute('data-autoplay-blocked') === '1') {
                    video.muted = true;
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('webkit-playsinline', 'true');
                    safePlay(video).then((ok) => {
                      if (ok) video.removeAttribute('data-autoplay-blocked');
                    });
                  }
                }}
              >
                <SuggestedUserCard
                  user={user}
                  onToggleFollow={handleToggleFollow}
                  onDismiss={handleDismiss}
                  isVisible={visibleCards.has(user.id)}
                  onFirstSwipe={() => dismissTutorial('swiped')}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Swipe Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            key="discover-tutorial-backdrop"
            className="fixed inset-0 z-[1200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
             <motion.div
               className="relative mx-6 w-[min(390px,69vw)] rounded-2xl bg-black/10 backdrop-blur-md text-white shadow-2xl p-5 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Swipe tutorial"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
               <div className="text-center">
                 <h3 className="text-lg font-semibold">{t('discover.tip.title')}</h3>
               </div>

               <div className="mt-5 flex items-start justify-center gap-16">
                 <div className="flex flex-col items-center">
                   <div className="text-center text-sm mb-3">{t('discover.tip.swipe_down')}</div>
                   <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-500/20">
                     <FaThumbsDown className="text-white text-lg" />
                   </div>
                   <div className="mt-2 text-xs opacity-90">{t('discover.tip.dismiss')}</div>
                 </div>
                 <div className="flex flex-col items-center">
                   <div className="text-center text-sm mb-3">{t('discover.tip.swipe_up')}</div>
                   <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-500/20">
                     <FaThumbsUp className="text-white text-lg" />
                   </div>
                   <div className="mt-2 text-xs opacity-90">{t('discover.tip.follow')}</div>
                 </div>
               </div>

               <div className="mt-5 flex justify-center">
                 <button
                   type="button"
                   onClick={() => dismissTutorial('got_it')}
                   className="rounded-xl px-4 py-2 bg-white/20 hover:bg-white/30 transition active:scale-[.98] focus:outline-none focus:ring-2 focus:ring-white/60"
                 >
                   {t('common.got_it')}
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuggestedUsersRedesigned;