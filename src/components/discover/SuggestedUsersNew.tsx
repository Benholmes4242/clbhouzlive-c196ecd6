import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import { BiSolidDetail } from 'react-icons/bi';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestedUsersDiscover } from '@/hooks/useSuggestedUsersDiscover';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useMedia } from '@/hooks/useMedia';
import { safePlay } from '@/utils/safePlay';

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
  const [showFeedback, setShowFeedback] = useState<'follow' | 'dismiss' | null>(null);
  const [isCardFading, setIsCardFading] = useState(false);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [panelDragY, setPanelDragY] = useState(0);
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showStaggeredContent, setShowStaggeredContent] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const FEEDBACK_MS = 1500;
  const COLLAPSE_THRESHOLD = 0.3;
  const DEBOUNCE_MS = 160;
  
  // Responsive breakpoints and control sizing
  const isDesktop = useMedia('(min-width: 1024px)');
  const enableVerticalSwipe = !isDesktop;
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Monitor container width for responsive controls
  useEffect(() => {
    const updateWidth = () => {
      if (cardRef.current) {
        setContainerWidth(cardRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Responsive control sizing based on container width
  const getControlSize = () => {
    if (containerWidth < 280) return { size: 40, gap: 12 }; // Compact
    if (containerWidth < 320) return { size: 44, gap: 16 }; // Standard
    return { size: 48, gap: 20 }; // Comfortable
  };

  const { size: controlSize, gap: controlGap } = getControlSize();

  // Safe area padding to ensure controls stay within card bounds
  const getSafeAreaPadding = () => {
    const totalControlsWidth = (controlSize * 3) + (controlGap * 2);
    const availableWidth = containerWidth - 32; // Account for minimum padding
    if (totalControlsWidth > availableWidth) {
      return Math.max(16, (containerWidth - totalControlsWidth) / 2);
    }
    return 24; // Default padding
  };

  const safeAreaPadding = getSafeAreaPadding();

  // Haptic feedback utility
  const triggerHaptic = (type: 'light' | 'success' | 'warning') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'success':
          navigator.vibrate([50, 30, 50]);
          break;
        case 'warning':
          navigator.vibrate([30, 20, 30]);
          break;
      }
    }
  };

  // Handle video autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !user.latestVideo) return;

    if (isVisible) {
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('preload', 'metadata');
      
      const attemptPlay = async () => {
        try {
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
      };

      const timer = setTimeout(attemptPlay, 100);
      return () => clearTimeout(timer);
    } else {
      video.pause();
      if (!video.paused) {
        video.currentTime = 0;
      }
    }
  }, [isVisible, user.latestVideo]);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-control-button]')) {
      return;
    }
    navigate(`/profile/${user.id}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFollowLoading || isDismissLoading || isTransitioning) return;
    
    // Interrupt expand animation if active
    if (isDetailExpanded && !showStaggeredContent) {
      setIsDetailExpanded(false);
      setIsTransitioning(false);
    }
    
    triggerHaptic('success');
    setShowFeedback('follow');
    
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onToggleFollow(user.id), 300);
    }, FEEDBACK_MS);
  };

  const handleDismissClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDismissLoading || isFollowLoading || isTransitioning) return;
    
    // Interrupt expand animation if active
    if (isDetailExpanded && !showStaggeredContent) {
      setIsDetailExpanded(false);
      setIsTransitioning(false);
    }
    
    triggerHaptic('warning');
    setShowFeedback('dismiss');
    
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onDismiss(user.id), 300);
    }, FEEDBACK_MS);
  };

  const handleDetailClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    triggerHaptic('light');
    
    if (isDetailExpanded) {
      // Collapse sequence
      setShowStaggeredContent(false);
      await new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 60 : 120));
      setIsDetailExpanded(false);
      await new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 60 : 200));
    } else {
      // Expand sequence - rail slides up first
      setIsDetailExpanded(true);
      await new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 60 : 220));
      setShowStaggeredContent(true);
    }
    
    setTimeout(() => setIsTransitioning(false), DEBOUNCE_MS);
  };

  // Handle panel drag for collapse gesture
  const handlePanelDragStart = () => {
    if (!isDetailExpanded) return;
    setIsPanelDragging(true);
  };

  const handlePanelDrag = (dy: number) => {
    if (!isDetailExpanded || !isPanelDragging) return;
    setPanelDragY(Math.max(0, dy));
  };

  const handlePanelDragEnd = async () => {
    if (!isDetailExpanded || !isPanelDragging) {
      setPanelDragY(0);
      setIsPanelDragging(false);
      return;
    }

    const cardHeight = 300;
    const dragPercentage = panelDragY / cardHeight;
    
    if (dragPercentage >= COLLAPSE_THRESHOLD && dragPercentage <= 0.4) {
      triggerHaptic('light');
      setShowStaggeredContent(false);
      await new Promise(resolve => setTimeout(resolve, prefersReducedMotion ? 60 : 120));
      setIsDetailExpanded(false);
    }
    
    setPanelDragY(0);
    setIsPanelDragging(false);
  };

  const handleSwipeUp = async () => {
    if (!enableVerticalSwipe) return;
    
    if (onFirstSwipe) onFirstSwipe();
    setSwipeDirection('up');
    setShowFeedback('follow');
    
    setTimeout(() => setSwipeDirection(null), FEEDBACK_MS);
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onToggleFollow(user.id), 300);
    }, FEEDBACK_MS);
  };

  const handleSwipeDown = async () => {
    if (!enableVerticalSwipe) return;
    
    if (onFirstSwipe) onFirstSwipe();
    setSwipeDirection('down');
    setShowFeedback('dismiss');
    
    setTimeout(() => setSwipeDirection(null), FEEDBACK_MS);
    setTimeout(() => {
      setIsCardFading(true);
      setTimeout(() => onDismiss(user.id), 300);
    }, FEEDBACK_MS);
  };

  const handleSwiping = (dx: number, dy: number) => {
    if (!enableVerticalSwipe) return;

    const verticalCandidate = Math.abs(dy) > Math.abs(dx) + 14;
    if (verticalCandidate) {
      setDragY(dy);
    }
  };

  const handleSwipeEnd = () => {
    setDragY(0);
  };

  // Enhanced swipe gesture with panel drag support
  const swipeRef = useSwipeGesture({
    onSwipeUp: enableVerticalSwipe ? handleSwipeUp : undefined,
    onSwipeDown: enableVerticalSwipe ? (isDetailExpanded ? undefined : handleSwipeDown) : undefined,
    onSwiping: enableVerticalSwipe ? (dx, dy) => {
      if (isDetailExpanded && dy > 0) {
        handlePanelDrag(dy);
      } else {
        handleSwiping(dx, dy);
      }
    } : undefined,
    onSwipeEnd: () => {
      handleSwipeEnd();
      handlePanelDragEnd();
    },
    threshold: 90,
    preventDefaultTouchMove: false,
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
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl cursor-pointer bg-gray-900"
        onClick={handleCardClick}
        style={{
          transform: `translateY(${dragY * 0.05}px)`,
          opacity: isCardFading ? 0 : (dragY !== 0 ? Math.max(0.7, 1 - Math.abs(dragY) * 0.003) : 1),
          willChange: dragY !== 0 || isCardFading ? 'transform, opacity' : 'auto'
        }}
        animate={{
          scale: swipeDirection ? 0.95 : 1,
          opacity: isCardFading ? 0 : 1
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          opacity: { duration: prefersReducedMotion ? 0.15 : 0.3 }
        }}
      >
        {/* Media Content */}
        {mediaUrl ? (
          isVideo ? (
            <EnhancedVideoPlayer
              ref={videoRef}
              src={mediaUrl}
              poster={user.latestVideo?.poster}
              autoplay={false}
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
              loading="lazy"
              decoding="async"
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

        {/* Enhanced Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

        {/* Feedback Overlay */}
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
              
              <motion.div 
                className="relative flex flex-col items-center justify-center px-6 py-4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <motion.div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 relative border-2"
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
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.25, type: "spring", stiffness: 500, damping: 20 }}
                >
                  <motion.div
                    className={cn(
                      "relative z-10 text-lg",
                      showFeedback === 'follow' ? "text-accent" : "text-red-400"
                    )}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, duration: 0.3, type: "spring", stiffness: 600, damping: 15 }}
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
                          transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
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
                          transition={{ delay: 0.2, duration: 0.2, ease: "easeOut" }}
                        />
                        <motion.path
                          d="M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.25, duration: 0.2, ease: "easeOut" }}
                        />
                      </svg>
                    )}
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.25, ease: "easeOut" }}
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

        {/* Main Control Overlay - Reduced Height for More Media Visibility */}
        <motion.div
          className={cn(
            "absolute inset-x-0 bottom-0 z-30",
            isDetailExpanded ? "" : "max-h-[32%]"
          )}
          initial={false}
          animate={{
            height: isDetailExpanded ? "100%" : "auto",
          }}
          style={{
            transform: `translateY(${isPanelDragging ? panelDragY * 0.5 : 0}px)`,
            willChange: isPanelDragging || isDetailExpanded ? 'height, transform' : 'auto'
          }}
          transition={{
            duration: isPanelDragging ? 0 : (prefersReducedMotion ? 0.12 : 0.22),
            ease: isDetailExpanded ? "easeOut" : "easeOut"
          }}
          onTouchStart={isDetailExpanded ? handlePanelDragStart : undefined}
        >
          {/* Glass Container with Proper Safe Areas */}
          <div 
            className="relative w-full h-full overflow-hidden rounded-2xl"
            style={{
              background: 'hsl(var(--glass-dark) / 0.85)', 
              backdropFilter: 'blur(16px) saturate(1.2)',
              border: '1px solid hsl(var(--glass-border) / 0.4)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            
            {/* Expanded Profile Content - Staggered Animation */}
            <AnimatePresence>
              {isDetailExpanded && (
                <motion.div
                  className="absolute inset-0 flex flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showStaggeredContent ? 1 : 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: prefersReducedMotion ? 0.06 : 0.15,
                    ease: "easeOut"
                  }}
                >
                  {/* Controls Rail at Top */}
                  <div 
                    className="flex items-center justify-center py-4"
                    style={{ paddingLeft: safeAreaPadding, paddingRight: safeAreaPadding }}
                  >
                    <div 
                      className="flex items-center justify-center"
                      style={{ gap: `${controlGap}px` }}
                    >
                      {/* Control buttons with responsive sizing */}
                      <ControlButton
                        type="dismiss"
                        size={controlSize}
                        onClick={handleDismissClick}
                        disabled={isDismissLoading || isFollowLoading || isTransitioning}
                        user={user}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                      
                      <ControlButton
                        type="detail"
                        size={controlSize}
                        onClick={handleDetailClick}
                        disabled={isTransitioning}
                        user={user}
                        isExpanded={isDetailExpanded}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                      
                      <ControlButton
                        type="follow"
                        size={controlSize}
                        onClick={handleFollowClick}
                        disabled={isFollowLoading || isDismissLoading || isTransitioning}
                        user={user}
                        prefersReducedMotion={prefersReducedMotion}
                      />
                    </div>
                  </div>

                  {/* Profile Info Section with Stagger */}
                  <div className="flex-1 flex flex-col justify-center px-4 pb-4">
                    {/* Avatar - First in stagger */}
                    <motion.div 
                      className="flex justify-center mb-4"
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ 
                        opacity: showStaggeredContent ? 1 : 0,
                        scale: showStaggeredContent ? 1 : 0.95,
                        y: showStaggeredContent ? 0 : 20
                      }}
                      transition={{ 
                        duration: prefersReducedMotion ? 0.06 : 0.25,
                        delay: prefersReducedMotion ? 0 : 0.02,
                        ease: "easeOut"
                      }}
                    >
                      <div 
                        className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform duration-200"
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
                            <span className="text-white text-2xl font-bold">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* User Info - Staggered */}
                    <motion.div 
                      className="text-center space-y-2"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ 
                        opacity: showStaggeredContent ? 1 : 0,
                        y: showStaggeredContent ? 0 : 15
                      }}
                      transition={{ 
                        duration: prefersReducedMotion ? 0.06 : 0.25,
                        delay: prefersReducedMotion ? 0 : 0.04,
                        ease: "easeOut"
                      }}
                    >
                      {/* Display Name */}
                      <motion.h3 
                        className="text-white font-bold text-xl cursor-pointer hover:text-white/90 transition-colors duration-200"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${user.id}`);
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: showStaggeredContent ? 1 : 0,
                          y: showStaggeredContent ? 0 : 10
                        }}
                        transition={{ 
                          duration: prefersReducedMotion ? 0.06 : 0.2,
                          delay: prefersReducedMotion ? 0 : 0.06,
                          ease: "easeOut"
                        }}
                      >
                        {user.displayName}
                      </motion.h3>
                      
                      {/* Handle */}
                      <motion.p 
                        className="text-white/70 text-base"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: showStaggeredContent ? 1 : 0,
                          y: showStaggeredContent ? 0 : 10
                        }}
                        transition={{ 
                          duration: prefersReducedMotion ? 0.06 : 0.2,
                          delay: prefersReducedMotion ? 0 : 0.08,
                          ease: "easeOut"
                        }}
                      >
                        @{user.handle}
                      </motion.p>
                      
                      {/* Home Club - truncate with ellipsis */}
                      {user.homeClub && (
                        <motion.p 
                          className="text-white/80 text-base font-medium mt-3 truncate px-4"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ 
                            opacity: showStaggeredContent ? 1 : 0,
                            y: showStaggeredContent ? 0 : 10
                          }}
                          transition={{ 
                            duration: prefersReducedMotion ? 0.06 : 0.2,
                            delay: prefersReducedMotion ? 0 : 0.1,
                            ease: "easeOut"
                          }}
                        >
                          {user.homeClub}
                          {user.handicap !== undefined && (
                            <span className="block mt-1 text-sm opacity-90">HCP {user.handicap}</span>
                          )}
                        </motion.p>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimized State - Bottom Controls Rail */}
            <AnimatePresence>
              {!isDetailExpanded && (
                <motion.div
                  className="py-2.5"
                  style={{ paddingLeft: safeAreaPadding, paddingRight: safeAreaPadding }}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Handle/line removed - more space for content */}
                  
                  <div 
                    className="flex items-center justify-center"
                    style={{ gap: `${controlGap}px` }}
                  >
                    <ControlButton
                      type="dismiss"
                      size={controlSize}
                      onClick={handleDismissClick}
                      disabled={isDismissLoading || isFollowLoading || isTransitioning}
                      user={user}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                    
                    <ControlButton
                      type="detail"
                      size={controlSize}
                      onClick={handleDetailClick}
                      disabled={isTransitioning}
                      user={user}
                      isExpanded={isDetailExpanded}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                    
                    <ControlButton
                      type="follow"
                      size={controlSize}
                      onClick={handleFollowClick}
                      disabled={isFollowLoading || isDismissLoading || isTransitioning}
                      user={user}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </div>

                  {/* Compact User Info - Closer to controls */}
                  <div className="mt-1.5 flex justify-center">
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

// Reusable Control Button Component
interface ControlButtonProps {
  type: 'dismiss' | 'detail' | 'follow';
  size: number;
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  user: any;
  isExpanded?: boolean;
  prefersReducedMotion: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  type,
  size,
  onClick,
  disabled,
  user,
  isExpanded = false,
  prefersReducedMotion
}) => {
  const getAriaLabel = () => {
    switch (type) {
      case 'dismiss':
        return `Dismiss suggestion for ${user.displayName}`;
      case 'detail':
        return `${isExpanded ? "Hide" : "Show"} details for ${user.displayName}`;
      case 'follow':
        return `Follow ${user.displayName}`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'dismiss':
        return <FaThumbsDown className="text-white text-base drop-shadow-sm" />;
      case 'detail':
        return (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ 
              duration: prefersReducedMotion ? 0.1 : 0.25, 
              ease: "easeInOut" 
            }}
          >
            <BiSolidDetail className="text-white text-base" />
          </motion.div>
        );
      case 'follow':
        return <FaThumbsUp className="text-white text-base" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'dismiss':
        return {
          hover: '0 0 16px hsl(0 67% 56% / 0.4)',
          glow: 'bg-red-500/10',
          hoverGlow: 'group-hover:bg-red-500/20 group-active:bg-red-500/30'
        };
      case 'detail':
        return {
          hover: '0 0 20px hsl(var(--accent) / 0.4)',
          glow: 'bg-accent/10',
          hoverGlow: 'group-hover:bg-accent/20 group-active:bg-accent/30'
        };
      case 'follow':
        return {
          hover: '0 0 20px hsl(var(--accent) / 0.4)',
          glow: 'bg-accent/10',
          hoverGlow: 'group-hover:bg-accent/20 group-active:bg-accent/30'
        };
    }
  };

  const colors = getColors();

  return (
    <motion.button
      data-control-button
      aria-label={getAriaLabel()}
      aria-expanded={type === 'detail' ? isExpanded : undefined}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: `${colors.hover}, var(--glass-shadow)`
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        duration: prefersReducedMotion ? 0.1 : 0.25
      }}
      className={cn(
        "group relative rounded-full flex items-center justify-center overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-transparent",
        type === 'detail' && isExpanded && "ring-1 ring-accent/30"
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        background: 'hsl(var(--glass-dark) / 0.9)', 
        backdropFilter: 'blur(16px) saturate(1.2)',
        border: '1px solid hsl(var(--glass-border) / 0.4)',
        boxShadow: type === 'detail' && isExpanded
          ? '0 0 20px hsl(var(--accent) / 0.3), 0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
    >
      {/* Enhanced glow effects */}
      <div className="absolute inset-0 bg-white/5 rounded-full transition-all duration-300 
                   group-hover:bg-white/10 group-active:bg-white/15" />
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-300",
        colors.glow,
        colors.hoverGlow
      )} />
      
      {/* Icon */}
      <div 
        className="relative z-10 flex items-center justify-center w-full h-full"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
      >
        {getIcon()}
      </div>
    </motion.button>
  );
};

// Main Component
interface SuggestedUsersNewProps {
  onUserFollow?: (userId: string) => void;
  onUserDismiss?: (userId: string) => void;
}

const SuggestedUsersNew: React.FC<SuggestedUsersNewProps> = ({ 
  onUserFollow,
  onUserDismiss 
}) => {
  const { users, loading, error, toggleFollow, refetch } = useSuggestedUsersDiscover();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isDesktop = useMedia('(min-width: 1024px)');

  const handleToggleFollow = async (userId: string) => {
    const success = await toggleFollow(userId);
    if (success) {
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

  const filteredUsers = users.filter(user => !dismissedUsers.has(user.id));

  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const cardWidth = 160;
      const scrollDistance = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      container.scrollBy({ left: scrollDistance, behavior: 'smooth' });
      setTimeout(updateScrollButtons, 300);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [filteredUsers.length]);

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
        threshold: [0, 0.3, 0.6, 1],
        rootMargin: '25px 0px 25px 0px'
      }
    );

    const cards = container.querySelectorAll('[data-card-id]');
    cards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [users]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Suggested For You</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 h-60 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || filteredUsers.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Suggested For You</h2>
        {isDesktop && (
          <div className="flex gap-2">
            <motion.button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-8 h-8 rounded-full border border-border bg-background/80 backdrop-blur-sm",
                "flex items-center justify-center transition-colors",
                canScrollLeft ? "hover:bg-accent/10" : "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-8 h-8 rounded-full border border-border bg-background/80 backdrop-blur-sm",
                "flex items-center justify-center transition-colors",
                canScrollRight ? "hover:bg-accent/10" : "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            data-card-id={user.id}
            className="flex-shrink-0 w-40 snap-start"
          >
            <SuggestedUserCard
              user={user}
              onToggleFollow={handleToggleFollow}
              onDismiss={handleDismiss}
              isVisible={visibleCards.has(user.id)}
              onFirstSwipe={() => {
                // Handle first swipe tutorial if needed
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsersNew;