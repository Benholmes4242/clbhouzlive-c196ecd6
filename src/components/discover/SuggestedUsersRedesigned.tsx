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


      {/* Liquid Glass Feedback Overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div 
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: showFeedback === 'follow' ? -30 : 30 }}
            transition={{ 
              duration: 0.25,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {/* Semi-transparent liquid glass background */}
            <motion.div 
              className="absolute inset-0"
              style={{
                background: 'hsl(var(--glass-dark))',
                backdropFilter: 'blur(16px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Feedback Content */}
            <motion.div 
              className="relative flex flex-col items-center justify-center px-6 py-4"
              initial={{ 
                opacity: 0, 
                scale: 0.9,
                y: 20
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25
              }}
            >
              {/* Icon Container with brand orange/red outline */}
              <motion.div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-3 relative",
                  "border-2"
                )}
                style={{
                  borderColor: showFeedback === 'follow' 
                    ? 'hsl(var(--accent))' 
                    : 'hsl(0 67% 56%)',
                  boxShadow: showFeedback === 'follow'
                    ? '0 0 20px hsl(var(--accent) / 0.3)'
                    : '0 0 20px hsl(0 67% 56% / 0.3)'
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1
                }}
                transition={{ 
                  delay: 0.1,
                  duration: 0.25,
                  type: "spring",
                  stiffness: 500,
                  damping: 20
                }}
              >
                {/* Icon with bounce animation */}
                <motion.div
                  className={cn(
                    "relative z-10 text-lg",
                    showFeedback === 'follow' 
                      ? "text-accent" 
                      : "text-red-400"
                  )}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 0
                  }}
                  transition={{ 
                    delay: 0.15,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 600,
                    damping: 15
                  }}
                >
                  {showFeedback === 'follow' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <motion.path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          delay: 0.2,
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                      />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <motion.path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          delay: 0.2,
                          duration: 0.2,
                          ease: "easeOut"
                        }}
                      />
                      <motion.path
                        d="M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ 
                          delay: 0.25,
                          duration: 0.2,
                          ease: "easeOut"
                        }}
                      />
                    </svg>
                  )}
                </motion.div>
              </motion.div>
              
              {/* Text with smaller, lighter styling */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.15,
                  duration: 0.25,
                  ease: "easeOut"
                }}
              >
                <div className="text-white text-sm leading-tight">
                  <span 
                    className="font-normal opacity-90"
                    style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}
                  >
                    {showFeedback === 'follow' ? "Followed" : "Dismissed"}
                  </span>
                  <br />
                  <span 
                    className="font-semibold"
                    style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)' }}
                  >
                    {user.displayName}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Feedback Bubble - Remove duplicate since it's handled above */}


      {/* Liquid Glass Overlay System */}
      <motion.div
        className="absolute inset-x-0 bottom-0 z-30"
        initial={false}
        animate={{
          height: isDetailExpanded ? "100%" : "64px",
          y: 0
        }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        {/* Single Overlay Container */}
        <div 
          className="relative w-full h-full overflow-hidden"
          style={{
            background: 'hsl(var(--glass-dark))',
            backdropFilter: 'blur(16px)',
            border: '1px solid hsl(var(--glass-border))',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          
          {/* Expanded Content - User Information at Top */}
          <AnimatePresence>
            {isDetailExpanded && (
              <motion.div
                className="absolute inset-x-0 top-0 px-4 pt-6 pb-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ 
                  duration: 0.2,
                  delay: 0.05,
                  ease: "easeOut"
                }}
              >
                {/* User Avatar */}
                <div className="flex justify-center mb-4">
                  <div 
                    className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${user.id}`);
                    }}
                  >
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center space-y-2">
                  <h3 
                    className="text-white font-bold text-lg cursor-pointer hover:text-white/90 transition-colors duration-200"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${user.id}`);
                    }}
                  >
                    {user.displayName}
                  </h3>
                  
                  <p className="text-white/70 text-sm"
                     style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    @{user.handle}
                  </p>
                  
                  {user.homeClub && (
                    <p className="text-white/80 text-sm font-medium"
                       style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {user.homeClub}
                      {user.handicap !== undefined && (
                        <span className="ml-2 opacity-90">• HCP {user.handicap}</span>
                      )}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass Control Bar - Fixed position at bottom */}
          <motion.div 
            className="absolute bottom-0 inset-x-0 px-3 py-3"
            style={{
              background: isDetailExpanded ? 'hsl(var(--glass-dark))' : 'transparent',
              backdropFilter: isDetailExpanded ? 'blur(16px)' : 'none',
              borderTop: isDetailExpanded ? '1px solid hsl(var(--glass-border))' : 'none'
            }}
          >
            <div className="flex items-center justify-center gap-5">
              {/* Left: Dismiss Button - Circular Glass */}
              <motion.button
                aria-label="Dismiss suggestion"
                onClick={handleDismissClick}
                disabled={isDismissLoading || isFollowLoading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 20px hsl(0 67% 56% / 0.3)'
                }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="group relative w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'hsl(var(--glass-dark))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid hsl(var(--glass-border))',
                  boxShadow: 'var(--glass-shadow)',
                  opacity: 0.85
                }}
              >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-red-500/10 rounded-full scale-0 group-hover:scale-110 
                             opacity-0 group-hover:opacity-20 transition-all duration-300" />
                <div className="absolute inset-0 bg-red-500/20 rounded-full scale-0 group-active:scale-110 
                             opacity-0 group-active:opacity-30 transition-all duration-200" />
                
                <FaThumbsDown className="relative text-white text-sm z-10" />
                <span className="absolute -inset-2" />
              </motion.button>

              {/* Center: Detail Button with enhanced halo */}
              <motion.button
                aria-label="View details"
                onClick={handleDetailClick}
                whileTap={{ scale: 0.95 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 20px hsl(var(--accent) / 0.3)'
                }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className={cn(
                  "group relative w-11 h-11 rounded-full flex items-center justify-center text-white overflow-hidden",
                  isDetailExpanded && "ring-1 ring-white/20"
                )}
                style={{
                  background: 'hsl(var(--glass-dark))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid hsl(var(--glass-border))',
                  boxShadow: isDetailExpanded 
                    ? '0 0 20px hsl(var(--accent) / 0.4), var(--glass-shadow)'
                    : 'var(--glass-shadow)',
                  opacity: 0.85
                }}
              >
                {/* Enhanced glow when expanded */}
                <div className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-110 
                             opacity-0 group-hover:opacity-20 transition-all duration-300" />
                <div className="absolute inset-0 bg-accent/20 rounded-full scale-0 group-active:scale-110 
                             opacity-0 group-active:opacity-30 transition-all duration-200" />
                
                <motion.div
                  className="relative z-10"
                  animate={{ rotate: isDetailExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <BiSolidDetail className="text-sm fill-white" />
                </motion.div>
                <span className="absolute -inset-2" />
              </motion.button>

              {/* Right: Follow Button with orange accent */}
              <motion.button
                aria-label="Follow user"
                onClick={handleFollowClick}
                disabled={isFollowLoading || isDismissLoading}
                whileTap={{ scale: 0.95 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 20px hsl(var(--accent) / 0.3)'
                }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="group relative w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: 'hsl(var(--glass-dark))',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid hsl(var(--glass-border))',
                  boxShadow: 'var(--glass-shadow)',
                  opacity: 0.85
                }}
              >
                {/* Orange glow effect */}
                <div className="absolute inset-0 bg-accent/10 rounded-full scale-0 group-hover:scale-110 
                             opacity-0 group-hover:opacity-20 transition-all duration-300" />
                <div className="absolute inset-0 bg-accent/20 rounded-full scale-0 group-active:scale-110 
                             opacity-0 group-active:opacity-30 transition-all duration-200" />
                
                <FaThumbsUp className="relative text-white text-sm z-10" />
                <span className="absolute -inset-2" />
              </motion.button>
            </div>
          </motion.div>

          {/* Compact User Info - Only show when collapsed */}
          <AnimatePresence>
            {!isDetailExpanded && (
              <motion.div
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
              >
                <div 
                  className="text-white font-medium text-center text-sm whitespace-nowrap px-3 py-1.5 rounded-full cursor-pointer hover:scale-105 transition-transform duration-200"
                  style={{ 
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    background: 'hsl(var(--glass-dark))',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid hsl(var(--glass-border))'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${user.id}`);
                  }}
                >
                  {user.displayName || user.handle || "User"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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