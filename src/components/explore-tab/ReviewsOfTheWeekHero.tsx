/**
 * ReviewsOfTheWeekHero - Hero carousel featuring top video reviews of the week
 * 
 * TikTok-Level Implementation:
 * - UnifiedVideoPlayer with source stability + HLS pool promotion
 * - 50% start / 10% stop hysteresis for viewport-aware autoplay
 * - 150ms crossfade with ease-out
 * - Priority poster loading for active/next slides
 * - 3s first-frame fallback timeout
 * - Preload next slide's HLS manifest
 * - GPU-accelerated slide transitions
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { UnifiedVideoPlayer } from '@/media/components/UnifiedVideoPlayer';
import { useReviewsOfTheWeek, ReviewOfTheWeek } from '@/hooks/useReviewsOfTheWeek';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { Loader2 } from 'lucide-react';
import { ReviewOverlayCore } from '@/components/shared/overlay/ReviewOverlayCore';

interface ReviewsOfTheWeekHeroProps {
  onFallbackToFeaturedCourse?: () => void;
  className?: string;
}

const AUTO_ADVANCE_INTERVAL = 5000; // 5 seconds
const PAUSE_AFTER_INTERACTION = 10000; // 10 seconds
const FIRST_FRAME_FALLBACK_MS = 3000; // 3s first-frame fallback

export function ReviewsOfTheWeekHero({ 
  onFallbackToFeaturedCourse,
  className 
}: ReviewsOfTheWeekHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const hasFallenBack = useRef(false);
  const heroContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch reviews
  const { data: reviews, isLoading } = useReviewsOfTheWeek({ limit: 7 });
  
  // P0: Viewport-aware hysteresis (50% start / 10% stop)
  useEffect(() => {
    if (!heroContainerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          setIsHeroVisible(true);
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.1) {
          setIsHeroVisible(false);
        }
      },
      { 
        threshold: [0.1, 0.5],
        rootMargin: '0px',
      }
    );
    
    observer.observe(heroContainerRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Preload next slide's HLS manifest
  useEffect(() => {
    if (!reviews?.length) return;
    
    const nextIndex = (currentIndex + 1) % reviews.length;
    const nextReview = reviews[nextIndex];
    if (!nextReview?.video_url) return;
    
    const uid = uidFromNode({ src: nextReview.video_url });
    if (uid) {
      const hlsUrl = generateStreamHlsUrl(uid);
      preloadHlsManifest(hlsUrl);
    }
  }, [currentIndex, reviews]);
  
  // Auto-advance logic
  useEffect(() => {
    if (!reviews?.length || isPaused || !isHeroVisible) return;
    
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, AUTO_ADVANCE_INTERVAL);
    
    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [reviews?.length, isPaused, isHeroVisible]);
  
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
  
  // Loading state with shimmer-down skeleton
  if (isLoading) {
    return (
      <div 
        className={cn(
          "relative w-full aspect-square bg-muted motion-safe:animate-shimmer-down",
          "flex items-center justify-center",
          className
        )}
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 motion-safe:animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Return null if no reviews (fallback is triggered via effect)
  if (!reviews?.length) {
    return null;
  }
  
  return (
    <div 
      ref={heroContainerRef}
      {...swipeHandlers}
      className={cn(
        "relative w-full overflow-hidden bg-black will-change-transform",
        className
      )}
    >
      {/* Video slides */}
      {reviews.map((review, index) => (
        <ReviewSlide
          key={review.post_id}
          review={review}
          isActive={index === currentIndex}
          isNextSlide={index === (currentIndex + 1) % reviews.length}
          isHeroVisible={isHeroVisible}
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
  isNextSlide: boolean;
  isHeroVisible: boolean;
  onTap: () => void;
  currentIndex: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
}

const ReviewSlide = React.memo(function ReviewSlide({
  review,
  isActive,
  isNextSlide,
  isHeroVisible,
  onTap,
  currentIndex,
  totalSlides,
  onGoToSlide,
}: ReviewSlideProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasReportedReadyRef = useRef(false);
  const firstFrameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // P0: Combined autoplay condition (active slide + hero in viewport)
  const shouldAutoplay = isActive && isHeroVisible;
  
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
    
    // Clear any pending timeout
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
  }, [review.post_id]);
  
  // P1: 3s first-frame fallback timeout
  useEffect(() => {
    if (isActive && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!hasReportedReadyRef.current) {
          hasReportedReadyRef.current = true;
          setIsVideoReady(true);
        }
      }, FIRST_FRAME_FALLBACK_MS);
      
      return () => {
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
        }
      };
    }
  }, [isActive, hlsUrl, isVideoReady]);
  
  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
      
      // Clear fallback timeout since video is ready
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    }
  }, []);
  
  // P1: Priority loading for active/next slides
  const isPrioritySlide = isActive || isNextSlide;
  
  return (
    <div
      className={cn(
        "relative w-full aspect-square motion-safe:transition-opacity motion-safe:duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none absolute inset-0"
      )}
      onClick={onTap}
      aria-busy={isActive && !isVideoReady}
    >
      {/* Media layer */}
      <div className="absolute inset-0">
        {/* Poster-first: always show thumbnail immediately */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={isPrioritySlide ? "eager" : "lazy"}
            fetchPriority={isPrioritySlide ? "high" : "auto"}
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        
        {/* 
          TikTok-Level: UnifiedVideoPlayer with source stability + HLS pool
          - 150ms crossfade (duration-150 ease-out)
          - Inherits buffering debounce via useBufferingIndicator
          - autoplay based on shouldAutoplay (isActive + isHeroVisible)
        */}
        {hlsUrl && (
          <div className={cn(
            "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={shouldAutoplay}
              muted
              loop
              preload="auto"
              showMuteButton={false}
              showPlayButton={false}
              scrubber={false}
              mediaId={streamId || undefined}
              className="h-full w-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          </div>
        )}
        
        {/* Skeleton until video ready - shimmer-down animation */}
        {!isVideoReady && !posterUrl && (
          <div 
            className="absolute inset-0 bg-muted motion-safe:animate-shimmer-down flex items-center justify-center"
            aria-busy="true"
          >
            <Loader2 className="w-8 h-8 motion-safe:animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Review overlay - top capsule + bottom left capsule */}
      <ReviewOverlayCore
        courseName={review.course_name}
        courseLocation={review.course_location}
        rating={review.rating}
        variant="tile"
        courseId={review.course_id}
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
              "h-1.5 rounded-full motion-safe:transition-all pointer-events-auto",
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
    prev.isNextSlide === next.isNextSlide &&
    prev.isHeroVisible === next.isHeroVisible &&
    prev.currentIndex === next.currentIndex &&
    prev.totalSlides === next.totalSlides
  );
});

export default ReviewsOfTheWeekHero;
