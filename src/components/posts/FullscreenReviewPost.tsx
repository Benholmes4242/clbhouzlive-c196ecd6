import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { getScoreTier } from '@/utils/getScoreTier';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { useReviewSheetStore } from '@/stores/reviewSheetStore';
// Respect reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

export interface ReviewMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string | null;
  stream_id?: string | null;
  display_order?: number | null;
  created_at?: string | null;
}

export interface FullscreenReviewPostProps {
  mode: 'preview' | 'live';
  
  // Core identity
  courseId: string;
  courseName: string;
  heroSubtitle?: string;
  
  // Review data
  rating: number;
  reviewText?: string | null;
  /** Review ID for deep linking to the specific review */
  reviewId?: string;
  
  // Media
  media: ReviewMediaItem[];
  
  // User info for bottom-left panel
  user?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
  
  // Controls
  initialIndex?: number;
  onBack?: () => void;
  
  // Dynamic bottom offset for carousel dots (to avoid CTA overlap)
  dotsBottomOffset?: number; // in pixels, default ~96 for preview, ~80 for live
  
  // Hide carousel arrows when used in Clubhouse feed (feed nav takes over)
  hideCarouselArrows?: boolean;
  
  // Hide the built-in user capsule (e.g. when Clubhouse renders its own CreatorCapsule)
  hideUserCapsule?: boolean;
  
  // Optional: Render children (e.g., Clubhouse action bar) on top of the overlay
  children?: React.ReactNode;
  
  // When false, skip rendering the media layer (used in Clubhouse where media is already rendered)
  renderMedia?: boolean;
}

/**
 * Fullscreen review post preview/display component.
 * Matches Clubhouse visual language - fullscreen media with overlay info.
 * Used for: Preview page, Clubhouse feed, Profile fullscreen viewer
 */
export function FullscreenReviewPost({
  mode,
  courseId,
  courseName,
  heroSubtitle,
  rating,
  reviewText,
  reviewId,
  media,
  user,
  // ... rest of props extracted below
  initialIndex = 0,
  onBack,
  dotsBottomOffset,
  hideCarouselArrows = false,
  hideUserCapsule = false,
  children,
  renderMedia = true,
}: FullscreenReviewPostProps) {
  const openReviewSheet = useReviewSheetStore((s) => s.open);

  const handleOpenReviewSheet = useCallback(() => {
    openReviewSheet({
      user: {
        id: 'preview',
        name: user?.name ?? 'You',
        username: user?.username,
        avatar: user?.avatar,
      },
      courseId,
      courseName,
      rating,
      reviewId,
      reviewText,
      // Preview mode — breakdown not wired to wizard state yet. Follow-up.
      breakdown: null,
      // Preview mode — no stats fetch (user hasn't published yet).
      reviewerStats: null,
    });
  }, [openReviewSheet, user, courseId, courseName, rating, reviewId, reviewText]);
  
  // All ratings now use amber/gold styling (unified system)
  
  // User initials for avatar fallback
  const initials = (user?.name || 'G')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  // Sort media: video first as cover, then by display_order/created_at
  const sortedMedia = React.useMemo(() => {
    if (!media.length) return [];
    
    const sorted = [...media].sort((a, b) => {
      // display_order first
      if (a.display_order != null && b.display_order != null) {
        return a.display_order - b.display_order;
      }
      // then created_at
      if (a.created_at && b.created_at) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return 0;
    });
    
    // Move first video to front if exists
    const firstVideoIdx = sorted.findIndex(m => m.media_type === 'video');
    if (firstVideoIdx > 0) {
      const [video] = sorted.splice(firstVideoIdx, 1);
      sorted.unshift(video);
    }
    
    return sorted;
  }, [media]);
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Sync internal state when parent updates initialIndex
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<HLSPlayerRef>(null);
  
  const hasMultipleMedia = sortedMedia.length > 1;
  const currentMedia = sortedMedia[currentIndex];
  const tierData = getScoreTier(rating);
  
  // Video playback - only when renderMedia=true (we own the video element)
  useEffect(() => {
    // Skip when we don't render media - parent handles video playback
    if (!renderMedia) return;
    
    if (currentMedia?.media_type === 'video' && videoPlayerRef.current) {
      // Small delay to ensure video element is ready after index change
      const timer = setTimeout(() => {
        videoPlayerRef.current?.play().catch(() => {
          // Autoplay blocked - silently ignore
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentMedia?.media_type, currentMedia?.id, renderMedia]);
  
  // Navigation
  const goToNext = useCallback(() => {
    if (isTransitioning || currentIndex >= sortedMedia.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex, sortedMedia]);
  
  const goToPrevious = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex(currentIndex - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex, sortedMedia]);
  
  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrevious(),
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50,
    touchEventOptions: { passive: false },
  });
  
  // Keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrevious();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);
  
  if (!sortedMedia.length && renderMedia !== false) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <p className="text-white/60 text-sm">No media available</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden",
        renderMedia ? "bg-black" : "bg-transparent"
      )}
      {...swipeHandlers}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Main Media with crossfade animation - only render if renderMedia is true */}
      {renderMedia && (
        <AnimatePresence mode="wait">
          <motion.div 
            key={`media-${currentIndex}`}
            className="absolute inset-0"
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' }}
          >
            {currentMedia.media_type === 'video' ? (
              <>
                {/* Blurred letterbox background for video */}
                <div
                  className="absolute inset-0 bg-black"
                  style={{ zIndex: 0 }}
                />
                {/* Main video — contain so nothing is cropped */}
                <div className="absolute inset-0" style={{ zIndex: 1 }}>
                  <HLSPlayer
                    key={`review-video-${currentMedia.id}-${currentIndex}`}
                    ref={videoPlayerRef}
                    src={currentMedia.media_url}
                    className="w-full h-full object-contain"
                    muted={isMuted}
                    loop={true}
                    autoplay={true}
                    showMuteButton={false}
                    showPlayButton={false}
                    mediaId={`review-preview-${currentMedia.id}`}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Blurred letterbox background */}
                <img
                  src={currentMedia.media_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
                  draggable={false}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-black/55" />
                {/* Main image — contain so nothing is cropped */}
                <img
                  src={currentMedia.media_url}
                  alt={courseName}
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'contain', position: 'relative', zIndex: 1 }}
                  draggable={false}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
      
      
      {/* Top gradient - subtle fade behind panel (only when we render our own media) */}
      {renderMedia && (
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/30 via-black/15 to-transparent pointer-events-none z-[4]" />
      )}
      
      {/* Bottom gradient — strengthened multi-stop scrim for text legibility on any photo (only when we render our own media) */}
      {renderMedia && (
        <div 
          className="absolute inset-x-0 bottom-0 pointer-events-none z-[5]" 
          style={{
            height: '50%',
            background: mode === 'preview'
              ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.3) 50%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
          }}
        />
      )}
      
      {/* Review info overlay — preview uses CreatorCapsule (matches Clubhouse), live uses top panel */}
      {mode === 'preview' && user ? (
        <CreatorCapsule
          user={{
            id: 'preview',
            name: user.name || 'You',
            username: user.username,
            avatar: user.avatar,
          }}
          isReview={true}
          reviewData={{
            courseId,
            courseName,
            courseLocation: heroSubtitle || '',
            rating,
            tierLabel: tierData.label,
            sourceReviewId: reviewId || '',
          }}
          onReviewTap={handleOpenReviewSheet}
          isVisible={true}
          caption={reviewText ?? ''}
          golfCourse={null}
          // Own-post preview branch — no follow button is rendered (isOwnPost).
          isFollowing={false}
          isOwnPost={true}
          bottomOffset="calc(env(safe-area-inset-bottom, 0px) + 56px)"
        />
      ) : null}
      {/* Inner review bottom sheet removed — now rendered via root-level ReviewBottomSheetPortal */}
      
      {/* Bottom-left user capsule - matches CreatorCapsule styling from Clubhouse (hidden in preview mode) */}
      {user && mode !== 'preview' && !hideUserCapsule && (
        <motion.div
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute left-5 z-20"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          }}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="flex items-center gap-3 px-3 py-2.5">
              <SquircleAvatar
                size={40}
                src={user.avatar}
                alt={user.name || 'Golfer'}
                fallback={initials}
                hideRing
              />
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">
                  {user.name || 'Golfer'}
                </div>
                <div className="flex items-center gap-0.5 mt-0.5 text-[11px] font-medium text-amber-400/90">
                  <span>Read review</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Media counter - REMOVED for review posts per design spec */}
      
      {/* Navigation arrows - refined styling with hover effects */}
      {hasMultipleMedia && !hideCarouselArrows && (
        <>
          <AnimatePresence>
            {currentIndex > 0 && (
              <motion.button
                initial={{ opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 z-30",
                  "w-10 h-10 rounded-full",
                  "bg-black/40 backdrop-blur-sm",
                  "flex items-center justify-center",
                  "border border-white/10",
                  "transition-all duration-200",
                  "hover:bg-black/60 hover:scale-105",
                  "active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {currentIndex < sortedMedia.length - 1 && (
              <motion.button
                initial={{ opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 z-30",
                  "w-10 h-10 rounded-full",
                  "bg-black/40 backdrop-blur-sm",
                  "flex items-center justify-center",
                  "border border-white/10",
                  "transition-all duration-200",
                  "hover:bg-black/60 hover:scale-105",
                  "active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}
      
      {/* Render children (e.g., Clubhouse action bar) - z-30 to sit above gradients */}
      <div className="pointer-events-auto z-30">
        {children}
      </div>
    </div>
  );
}

export default FullscreenReviewPost;
