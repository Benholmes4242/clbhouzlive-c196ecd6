/**
 * ReviewsOfTheWeekHero - Hero carousel featuring top video reviews of the week
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid for consistent autoplay behavior.
 * 
 * Features:
 * - Auto-advancing slides (5s interval)
 * - Swipe navigation on mobile
 * - Direct visibility-based autoplay (no external MediaRuntime)
 * - Falls back to Featured Course if no video reviews
 * - Uses ReviewOverlayCore for consistent overlay styling
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { useReviewsOfTheWeek, ReviewOfTheWeek } from '@/hooks/useReviewsOfTheWeek';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { Loader2 } from 'lucide-react';
import { ReviewOverlayCore } from '@/components/shared/overlay/ReviewOverlayCore';

interface ReviewsOfTheWeekHeroProps {
  onFallbackToFeaturedCourse?: () => void;
  className?: string;
}

const AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds
const PAUSE_AFTER_INTERACTION = 10000; // 10 seconds

export function ReviewsOfTheWeekHero({ 
  onFallbackToFeaturedCourse,
  className 
}: ReviewsOfTheWeekHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const hasFallenBack = useRef(false);
  
  // Fetch reviews
  const { data: reviews, isLoading } = useReviewsOfTheWeek({ limit: 7 });
  
  // Auto-advance logic
  useEffect(() => {
    if (!reviews?.length || isPaused) return;
    
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, AUTO_ADVANCE_INTERVAL);
    
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [reviews?.length, isPaused]);
  
  // Handle user interaction (pause auto-advance)
  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, PAUSE_AFTER_INTERACTION);
  }, []);
  
  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    handleInteraction();
    setCurrentIndex(index);
  }, [handleInteraction]);
  
  const goNext = useCallback(() => {
    if (!reviews?.length) return;
    handleInteraction();
    setCurrentIndex(prev => (prev + 1) % reviews.length);
  }, [reviews?.length, handleInteraction]);
  
  const goPrev = useCallback(() => {
    if (!reviews?.length) return;
    handleInteraction();
    setCurrentIndex(prev => (prev - 1 + reviews.length) % reviews.length);
  }, [reviews?.length, handleInteraction]);
  
  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });
  
  // Handle tap on review
  const handleReviewTap = useCallback((review: ReviewOfTheWeek) => {
    navigate(`/post/${review.post_id}`);
  }, [navigate]);

  // Fallback to featured course if no reviews (only trigger once)
  useEffect(() => {
    if (!isLoading && !reviews?.length && !hasFallenBack.current) {
      hasFallenBack.current = true;
      onFallbackToFeaturedCourse?.();
    }
  }, [isLoading, reviews?.length, onFallbackToFeaturedCourse]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        "relative w-full aspect-square bg-muted animate-pulse",
        "flex items-center justify-center",
        className
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Return null if no reviews (fallback is triggered via effect)
  if (!reviews?.length) {
    return null;
  }
  
  return (
    <div 
      {...swipeHandlers}
      className={cn(
        "relative w-full overflow-hidden bg-black",
        className
      )}
    >
      {/* Video slides */}
      {reviews.map((review, index) => (
        <ReviewSlide
          key={review.post_id}
          review={review}
          isActive={index === currentIndex}
          onTap={() => handleReviewTap(review)}
          currentIndex={currentIndex}
          totalSlides={reviews.length}
          onGoToSlide={goToSlide}
        />
      ))}
    </div>
  );
}

// Individual slide component
interface ReviewSlideProps {
  review: ReviewOfTheWeek;
  isActive: boolean;
  onTap: () => void;
  currentIndex: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
}

const ReviewSlide = React.memo(function ReviewSlide({
  review,
  isActive,
  onTap,
  currentIndex,
  totalSlides,
  onGoToSlide,
}: ReviewSlideProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  // CRITICAL: Extract stream UID for cache consistency
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!review.video_url) return { hlsUrl: null, posterUrl: null, streamId: null };
    const extractedStreamId = uidFromNode({ src: review.video_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: review.thumbnail_url, streamId: null };
    
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { width: 1280, height: 720, time: 1 });
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl 
      : review.thumbnail_url;
    
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [review.video_url, review.thumbnail_url]);
  
  // Reset ready flag when review changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [review.post_id]);
  
  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
    }
  }, []);
  
  return (
    <div
      className={cn(
        "relative w-full aspect-square transition-opacity duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none absolute inset-0"
      )}
      onClick={onTap}
    >
      {/* Media layer */}
      <div className="absolute inset-0">
        {/* Poster-first: always show thumbnail immediately */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        {/* 
          UNIFIED WITH CLUBHOUSE: HLSPlayer uses same props as Clubhouse VideoWithAutoplay.
          - managedByMediaRuntime={false} for direct browser-led autoplay
          - externallyManaged={false} for HLS.js internal management
          - autoplay based on isActive state (carousel logic)
          - preload="auto" for instant buffering
        */}
        {hlsUrl && (
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isActive}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              showScrubber={false}
              managedByMediaRuntime={false}
              externallyManaged={false}
              mediaId={streamId || undefined}
              className="h-full w-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
        )}
        
        {/* Skeleton until video ready */}
        {!isVideoReady && !posterUrl && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Review overlay - top capsule + bottom left capsule */}
      <ReviewOverlayCore
        courseName={review.course_name}
        courseLocation={review.course_location}
        rating={review.rating}
        variant="tile"
        user={{
          name: review.display_name || review.username,
          avatar: review.avatar_url,
        }}
      />

      {/* Carousel dots - positioned at bottom right */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onGoToSlide(i);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all pointer-events-auto",
              i === currentIndex ? "w-6 bg-white/90" : "w-1.5 bg-white/35"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.review.post_id === next.review.post_id &&
    prev.isActive === next.isActive &&
    prev.currentIndex === next.currentIndex &&
    prev.totalSlides === next.totalSlides
  );
});

export default ReviewsOfTheWeekHero;
