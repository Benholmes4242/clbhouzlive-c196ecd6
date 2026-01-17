import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { RatingPill } from '@/components/ui/RatingPill';
import { getScoreTier } from '@/utils/getScoreTier';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ReviewOverlayCore } from '@/components/shared/overlay/ReviewOverlayCore';

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
  
  // Media
  media: ReviewMediaItem[];
  
  // Controls
  initialIndex?: number;
  onBack?: () => void;
  
  // Dynamic bottom offset for carousel dots (to avoid CTA overlap)
  dotsBottomOffset?: number; // in pixels, default ~96 for preview, ~80 for live
  
  // Hide carousel arrows when used in Clubhouse feed (feed nav takes over)
  hideCarouselArrows?: boolean;
  
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
  media,
  initialIndex = 0,
  onBack,
  dotsBottomOffset,
  hideCarouselArrows = false,
  children,
  renderMedia = true,
}: FullscreenReviewPostProps) {
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
  const isOutstanding = rating >= 9.0;
  
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
  
  if (!sortedMedia.length) {
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
      
      
      {/* Top gradient - subtle fade behind panel */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/30 via-black/15 to-transparent pointer-events-none z-[4]" />
      
      {/* Bottom gradient - softer fade */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none z-[5]" />
      
      {/* Premium Top Overlay Panel - Refined: lighter, reduced height */}
      <motion.div 
        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeOut', delay: 0.1 }}
        className={cn(
          "absolute left-4 right-4 z-20 top-[66px]",
          "rounded-xl border",
          "shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        )}
        style={{
          background: isOutstanding 
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.3) 100%)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          borderColor: isOutstanding 
            ? 'rgba(251, 191, 36, 0.2)' 
            : 'rgba(255, 255, 255, 0.08)',
          boxShadow: isOutstanding
            ? '0 4px 20px rgba(245, 158, 11, 0.12)'
            : '0 4px 20px rgba(0, 0, 0, 0.2)',
          padding: '12px 16px',
        }}
      >
        <Sheet>
          {/* ROW 1: Course Name + Rating (top-aligned, compact) */}
          <div className="flex justify-between items-start gap-3">
            {/* Left: Course Name + Location stacked */}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-sm">
                {courseName}
              </h2>
              {heroSubtitle && (
                <p className="text-white/50 text-xs mt-0.5 font-normal">
                  {heroSubtitle}
                </p>
              )}
              {mode === 'preview' && (
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[9px] font-medium tracking-wide uppercase">
                  Preview
                </span>
              )}
            </div>
            
            {/* Right: Rating Number (elegant, confident) */}
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-1 focus:ring-offset-black/20 rounded-lg">
                <span 
                  className="font-bold tracking-tight leading-none"
                  style={{ 
                    fontSize: '2.25rem',
                    fontVariantNumeric: 'tabular-nums',
                    background: isOutstanding 
                      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                      : 'transparent',
                    WebkitBackgroundClip: isOutstanding ? 'text' : 'unset',
                    WebkitTextFillColor: isOutstanding ? 'transparent' : '#FFFFFF',
                    color: isOutstanding ? 'transparent' : '#FFFFFF',
                    textShadow: isOutstanding 
                      ? '0 0 16px rgba(251, 191, 36, 0.4)' 
                      : 'none',
                  }}
                >
                  {rating === 10 ? '10' : rating.toFixed(1)}
                </span>
                {/* Smaller, secondary tier label */}
                <span 
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-wider mt-0.5",
                    isOutstanding ? "text-amber-400/70" : "text-white/40"
                  )}
                >
                  {tierData.tier}
                </span>
              </button>
            </SheetTrigger>
          </div>
          
          {/* Sheet Content (review details) */}
          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-3xl">
            <SheetHeader className="text-left pb-2">
              <SheetTitle className="text-lg font-bold leading-tight line-clamp-2">{courseName}</SheetTitle>
              {heroSubtitle && (
                <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">{heroSubtitle}</p>
              )}
            </SheetHeader>
            
            <div className="space-y-4 pt-2">
              {/* Rating */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold tabular-nums">
                  {rating === 10 ? '10' : rating.toFixed(1)}
                </span>
                <RatingPill score={rating} />
              </div>
              
              {/* Review text */}
              {reviewText && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {reviewText}
                  </p>
                </div>
              )}
              
              {/* Preview mode helper text */}
              {mode === 'preview' && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    This is how your post will look in Clubhouse + Profile.
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>
      
      {/* Media counter - positioned dynamically to avoid CTA overlap */}
      {hasMultipleMedia && (
        <motion.div 
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut', delay: 0.2 }}
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{ 
            bottom: dotsBottomOffset 
              ? `${dotsBottomOffset}px` 
              : mode === 'preview' ? '108px' : '80px' 
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            {sortedMedia.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50",
                  idx === currentIndex 
                    ? "bg-white w-6 h-2 shadow-lg shadow-white/30" 
                    : "bg-white/40 hover:bg-white/60 w-2 h-2"
                )}
                aria-label={`View photo ${idx + 1} of ${sortedMedia.length}`}
              />
            ))}
          </div>
        </motion.div>
      )}
      
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
