import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { RatingPill } from '@/components/ui/RatingPill';
import { getScoreTier } from '@/utils/getScoreTier';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import HLSPlayer, { HLSPlayerRef } from '@/media/HLSPlayer';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ReviewOverlayCore } from '@/components/shared/overlay/ReviewOverlayCore';

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
      {/* Main Media - only render if renderMedia is true */}
      {renderMedia && (
        <div className="absolute inset-0">
          {(() => {
            console.log('[FullscreenReviewPost] 🎬 RENDERING MEDIA:', {
              index: currentIndex,
              type: currentMedia.media_type,
              id: currentMedia.id?.substring(0, 8),
              isVideo: currentMedia.media_type === 'video',
            });
            
            if (currentMedia.media_type === 'video') {
              console.log('[FullscreenReviewPost] 🎥 Rendering HLSPlayer:', {
                key: `review-video-${currentMedia.id}-${currentIndex}`,
                src: currentMedia.media_url?.substring(0, 50),
                autoplay: true,
                muted: isMuted,
                poster: currentMedia.poster_url?.substring(0, 50),
                mediaId: `review-preview-${currentMedia.id}`,
              });
              
              return (
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
              );
            } else {
              console.log('[FullscreenReviewPost] 🖼️ Rendering image element');
              return (
                <img
                  src={currentMedia.media_url}
                  alt={courseName}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              );
            }
          })()}
        </div>
      )}
      
      {/* DEBUG: Log when renderMedia is false */}
      {!renderMedia && (() => {
        console.log('[FullscreenReviewPost] ⚠️ renderMedia=false - parent owns media rendering', {
          currentIndex,
          currentMediaType: currentMedia?.media_type,
          currentMediaId: currentMedia?.id?.substring(0, 8),
        });
        return null;
      })()}
      
      {/* Top gradient - subtle fade behind panel */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/30 via-black/15 to-transparent pointer-events-none z-[4]" />
      
      {/* Bottom gradient - softer fade */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none z-[5]" />
      
      {/* Premium Top Overlay Panel - Matches CreatorCapsule review styling */}
      <div 
        className={cn(
          "absolute left-4 right-4 z-20 top-[66px]",
          "rounded-xl backdrop-blur-xl border",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
          isOutstanding 
            ? "bg-[rgba(210,180,97,0.08)]" 
            : "bg-black/50"
        )}
        style={{
          borderColor: isOutstanding 
            ? 'rgba(210, 180, 97, 0.3)' 
            : 'rgba(255, 255, 255, 0.08)',
          padding: '16px',
        }}
      >
        <Sheet>
          {/* ROW 1: Course Name + Rating Number (top-aligned) */}
          <div className="flex justify-between items-start gap-4">
            {/* Left: Course Name */}
            <h2 className="flex-1 min-w-0 text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-md">
              {courseName}
            </h2>
            
            {/* Right: Rating Number (tappable to open sheet) */}
            <SheetTrigger asChild>
              <button 
                className="text-4xl sm:text-5xl font-bold tabular-nums drop-shadow-lg leading-none flex-shrink-0"
                style={{ color: isOutstanding ? '#D2B461' : '#FFFFFF' }}
              >
                {rating === 10 ? '10' : rating.toFixed(1)}
              </button>
            </SheetTrigger>
          </div>
          
          {/* ROW 2: Location + Rating Descriptor Badge */}
          <div className="flex justify-between items-start gap-4 mt-1.5">
            {/* Left: Location + Preview badge */}
            <div className="flex-1 min-w-0">
              {heroSubtitle && (
                <p className="text-white/60 text-sm drop-shadow-sm">
                  {heroSubtitle}
                </p>
              )}
              
              {mode === 'preview' && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-[10px] font-medium tracking-wide uppercase">
                  Preview
                </span>
              )}
            </div>
            
            {/* Right: Rating Descriptor Badge (right-aligned under rating number) */}
            <div className="flex-shrink-0">
              <RatingPill score={rating} className="text-[8px] py-0.5 px-2 opacity-80" />
            </div>
          </div>
          
          {/* Sheet Content (review details) */}
          <SheetContent side="bottom" className="max-h-[70vh] rounded-t-3xl">
            <SheetHeader className="text-left pb-2">
              <SheetTitle className="text-lg">{courseName}</SheetTitle>
              {heroSubtitle && (
                <p className="text-sm text-muted-foreground">{heroSubtitle}</p>
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
      </div>
      
      {/* Media counter - positioned dynamically to avoid CTA overlap */}
      {hasMultipleMedia && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{ 
            bottom: dotsBottomOffset 
              ? `${dotsBottomOffset}px` 
              : mode === 'preview' ? '108px' : '80px' 
          }}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
            {sortedMedia.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  idx === currentIndex 
                    ? "bg-white w-4" 
                    : "bg-white/50 hover:bg-white/70"
                )}
                aria-label={`Go to media ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Navigation arrows - matching Clubhouse feed styling */}
      {hasMultipleMedia && !hideCarouselArrows && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {currentIndex < sortedMedia.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
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
