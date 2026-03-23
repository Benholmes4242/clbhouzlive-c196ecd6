import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { RatingPill } from '@/components/ui/RatingPill';
import { getScoreTier } from '@/utils/getScoreTier';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
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
  
  const navigate = useNavigate();
  
  // Controlled sheet state for review bottom sheet
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);

  const handleOpenReviewSheet = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsReviewSheetOpen(true);
  }, [courseId, courseName, reviewId]);
  
  const handleCloseReviewSheet = useCallback(() => {
    
    setIsReviewSheetOpen(false);
    // No navigation - user stays on Clubhouse
  }, []);
  
  const handleViewCourse = useCallback(() => {
    handleCloseReviewSheet();
    navigate(`/courses/${courseId}`);
  }, [courseId, navigate, handleCloseReviewSheet]);
  
  const handleReadFullReview = useCallback(() => {
    handleCloseReviewSheet();
    // Navigate to course reviews tab with reviewId for deep linking (same as CreatorCapsule)
    if (reviewId) {
      navigate(`/courses/${courseId}?tab=reviews&review=${reviewId}`);
    } else {
      navigate(`/courses/${courseId}?tab=reviews`);
    }
  }, [courseId, reviewId, navigate, handleCloseReviewSheet]);
  
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
  const theme = getReviewOverlayTheme(rating);
  
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
              <HLSPlayer
                key={`review-video-${currentMedia.id}-${currentIndex}`}
                ref={videoPlayerRef}
                src={currentMedia.media_url}
                className="w-full h-full object-cover"
                muted={isMuted}
                loop={true}
                autoplay={true}
                showMuteButton={false}
                showPlayButton={false}
                mediaId={`review-preview-${currentMedia.id}`}
              />
            ) : (
              <img
                src={currentMedia.media_url}
                alt={courseName}
                className="w-full h-full object-cover"
                draggable={false}
              />
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
          onReviewTap={() => handleOpenReviewSheet({} as React.MouseEvent)}
          isVisible={true}
          caption=""
          golfCourse={null}
          isFollowing={false}
          isOwnPost={true}
          bottomOffset="calc(env(safe-area-inset-bottom, 0px) + 160px)"
        />
      ) : mode === 'live' ? (
        <motion.button
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0 }}
          onClick={handleOpenReviewSheet}
          className={cn(
            "absolute left-4 right-4 z-20",
            "rounded-xl border",
            "shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
            "pointer-events-auto cursor-pointer transition-transform active:scale-[0.98]",
            "text-left w-auto"
          )}
          style={{
            top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 72px)',
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.3) 100%)',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            padding: '12px 16px',
          }}
        >
          {/* ROW 1: Course Name + Rating (top-aligned, compact) */}
          <div className="flex justify-between items-start gap-3">
            {/* Left: Course Name + Location stacked */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-sm">
                {courseName}
              </h2>
              {heroSubtitle && (
                <p className="text-white/50 text-xs mt-0.5 font-normal truncate">
                  {heroSubtitle}
                </p>
              )}
            </div>
            
            {/* Right: Rating Number — all tiers use amber */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
              <span 
                className="font-bold tracking-tight leading-none"
                style={{ 
                  fontSize: 'clamp(1.5rem, 7vw, 2.25rem)',
                  fontVariantNumeric: 'tabular-nums',
                  color: '#f59e0b',
                  textShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </span>
              <span 
                className="text-[9px] font-medium uppercase tracking-wider mt-0.5"
                style={{ color: 'rgba(245, 158, 11, 0.7)' }}
              >
                {tierData.label}
              </span>
            </div>
          </div>
        </motion.button>
      ) : null}
      
      {/* Review Bottom Sheet - Liquid Glass with swipe-to-dismiss */}
      <BottomSheet 
        open={isReviewSheetOpen} 
        onClose={handleCloseReviewSheet}
        className="h-[70vh]"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.2)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex flex-col h-full px-6 pb-6 overflow-hidden">
          {/* Header: Course info */}
          <div className="flex flex-col gap-1 mb-5 pt-2">
            <h2 className="text-xl font-semibold text-white truncate">{courseName}</h2>
            {heroSubtitle && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                <span className="text-sm text-white/50 truncate">{heroSubtitle}</span>
              </div>
            )}
          </div>

          {/* Rating - large centered number with dynamic color */}
          <div className="flex flex-col items-center justify-center mb-4">
            <span 
              className="text-5xl font-bold"
              style={{ color: '#f59e0b' }}
            >
              {rating === 10 ? '10' : rating.toFixed(1)}
            </span>
            <span 
              className="text-sm font-semibold uppercase tracking-wider mt-1"
              style={{ color: 'rgba(245, 158, 11, 0.8)' }}
            >
              {tierData.label}
            </span>
          </div>

          {/* Review Text - Scrollable with glass card and fade effect */}
          {reviewText && (
            <div 
              className="flex-1 min-h-0 mb-4 overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, transparent 100%)',
              }}
            >
              <ScrollArea className="h-full">
                <div 
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '0.5px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap">
                    "{reviewText}"
                  </p>
                </div>
                {/* Bottom spacer so text can scroll above the fade */}
                <div className="h-8" />
              </ScrollArea>
            </div>
          )}
          
          {/* No review text placeholder */}
          {!reviewText && (
            <div className="flex-1 min-h-0 mb-4 flex items-center justify-center">
              <p className="text-white/40 text-sm italic">No written review</p>
            </div>
          )}

          {/* CTAs - Glass style buttons */}
          <div className="flex gap-3 mb-4" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <button
              onClick={handleViewCourse}
              className="flex-1 py-3.5 rounded-xl font-medium text-sm text-white/80 transition-all active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '0.5px solid rgba(255,255,255,0.15)',
              }}
            >
              View Course
            </button>
            <button
              onClick={handleReadFullReview}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                boxShadow: '0 4px 14px rgba(251,191,36,0.25)',
                color: '#000',
              }}
            >
              Read Full Review
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Attribution */}
          {user && (
            <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
              {user.avatar && (
                <SquircleAvatar
                  size={20}
                  src={user.avatar}
                  alt={user.name || 'Golfer'}
                  fallback={(user.name || 'G').charAt(0)}
                  hideRing
                />
              )}
              <span>Review by {user.name || 'Golfer'}</span>
            </div>
          )}
          
          {/* Preview mode helper text */}
          {mode === 'preview' && (
            <div className="pt-3 border-t border-white/10 mt-2">
              <p className="text-xs text-white/40 text-center">
                This is how your post will look in Clubhouse + Profile.
              </p>
            </div>
          )}
        </div>
      </BottomSheet>
      
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
