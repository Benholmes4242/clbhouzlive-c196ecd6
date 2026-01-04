import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { RatingPill } from '@/components/ui/RatingPill';
import { getScoreTier } from '@/utils/getScoreTier';
import HLSPlayer from '@/media/HLSPlayer';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  mode: 'preview' | 'feed';
  
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
}

/**
 * Fullscreen review post preview/display component.
 * Matches Clubhouse visual language - fullscreen media with overlay info.
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const hasMultipleMedia = sortedMedia.length > 1;
  const currentMedia = sortedMedia[currentIndex];
  const tierData = getScoreTier(rating);
  
  // Navigation
  const goToNext = useCallback(() => {
    if (isTransitioning || currentIndex >= sortedMedia.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex, sortedMedia.length]);
  
  const goToPrevious = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, currentIndex]);
  
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
      className="relative w-full h-full bg-black overflow-hidden"
      {...swipeHandlers}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Main Media */}
      <div className="absolute inset-0">
        {currentMedia.media_type === 'video' ? (
          <HLSPlayer
            key={`review-video-${currentMedia.id}-${currentIndex}`}
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
      </div>
      
      {/* Top gradient - lighter + shorter for cleaner media display */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 via-black/10 to-transparent pointer-events-none z-10" />
      
      {/* Bottom gradient - softer fade, less muddy */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/45 via-black/15 to-transparent pointer-events-none z-10" />
      
      {/* Top-left: Course info + Preview badge stacked */}
      <div className="absolute top-4 left-4 right-20 z-20">
        <h2 className="text-white text-lg font-semibold leading-tight drop-shadow-md line-clamp-2">
          {courseName}
        </h2>
        {heroSubtitle && (
          <p className="text-white/80 text-sm mt-0.5 drop-shadow-sm">
            {heroSubtitle}
          </p>
        )}
        {/* Preview pill under location */}
        {mode === 'preview' && (
          <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-medium tracking-wide">
            Preview
          </span>
        )}
      </div>
      
      {/* Top-right: Rating + tier */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
            <span className="text-white text-3xl font-bold tabular-nums drop-shadow-lg">
              {rating === 10 ? '10' : rating.toFixed(1)}
            </span>
            <RatingPill score={rating} className="text-[10px] py-0.5 px-2" />
            <span className="text-white/60 text-[10px] font-medium tracking-wide">
              From a review
            </span>
          </button>
        </SheetTrigger>
        
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
      
      {/* Preview tag removed - now in top-left under location */}
      
      {/* Media counter - positioned higher to not collide with CTA bar */}
      {hasMultipleMedia && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 mb-3">
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
      
      {/* Navigation arrows - more glassy, larger tap targets */}
      {hasMultipleMedia && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 z-20",
              "w-11 h-11 rounded-full bg-black/25 backdrop-blur-md border border-white/10",
              "flex items-center justify-center transition-all active:scale-[0.98]",
              currentIndex === 0 ? "opacity-0 pointer-events-none" : "hover:bg-black/40"
            )}
            aria-label="Previous media"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentIndex === sortedMedia.length - 1}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 z-20",
              "w-11 h-11 rounded-full bg-black/25 backdrop-blur-md border border-white/10",
              "flex items-center justify-center transition-all active:scale-[0.98]",
              currentIndex === sortedMedia.length - 1 ? "opacity-0 pointer-events-none" : "hover:bg-black/40"
            )}
            aria-label="Next media"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}
    </div>
  );
}

export default FullscreenReviewPost;
