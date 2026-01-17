/**
 * ReviewsOfTheWeekHero - Hero carousel featuring top video reviews of the week
 * 
 * Displays a dynamic carousel of the best video reviews with:
 * - Auto-advancing slides (5s interval)
 * - Swipe navigation on mobile
 * - Paused-video-first architecture with prefetching
 * - Falls back to Featured Course if no video reviews
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { useReviewsOfTheWeek, ReviewOfTheWeek } from '@/hooks/useReviewsOfTheWeek';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { MapPin, Trophy, ChevronRight, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const { data: reviews, isLoading, error } = useReviewsOfTheWeek({ limit: 7 });
  
  // Video ready queue
  const {
    initiatePrefetch,
    markReady,
    isReady,
  } = useVideoReadyQueue({
    prefetchAhead: 3,
    prefetchBehind: 1,
    onVideoReady: (id) => console.log(`[ReviewsOfTheWeekHero] Video ${id.substring(0, 8)} marked ready`),
  });
  
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;
  
  // Create video URL map
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    reviews?.forEach(review => {
      if (review.video_url) {
        const streamId = uidFromNode({ src: review.video_url });
        if (streamId) {
          map.set(review.post_id, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [reviews]);
  
  const videoIds = useMemo(() => 
    reviews?.map(r => r.post_id) || [],
    [reviews]
  );
  
  // Trigger prefetch
  useEffect(() => {
    if (videoIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoIds, currentIndex, videoUrlMap);
    }
  }, [videoIds, videoUrlMap, currentIndex, initiatePrefetch]);
  
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
        "relative w-full overflow-hidden rounded-2xl bg-black",
        className
      )}
    >
      {/* Video slides */}
      {reviews.map((review, index) => (
        <ReviewSlide
          key={review.post_id}
          review={review}
          isActive={index === currentIndex}
          isVideoReady={isReady(review.post_id)}
          onReady={(id) => markReadyRef.current(id)}
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
  isVideoReady: boolean;
  onReady: (id: string) => void;
  onTap: () => void;
  currentIndex: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
}

const ReviewSlide = React.memo(function ReviewSlide({
  review,
  isActive,
  isVideoReady,
  onReady,
  onTap,
  currentIndex,
  totalSlides,
  onGoToSlide,
}: ReviewSlideProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  
  // Get HLS URL and poster
  const { hlsUrl, posterUrl } = useMemo(() => {
    if (!review.video_url) return { hlsUrl: null, posterUrl: null };
    const streamId = uidFromNode({ src: review.video_url });
    if (!streamId) return { hlsUrl: null, posterUrl: null };
    return {
      hlsUrl: generateStreamHlsUrl(streamId),
      posterUrl: generateStreamThumbnailUrl(streamId, { width: 1280, height: 720, time: 1 }),
    };
  }, [review.video_url]);
  
  // Reset ready flag when review changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [review.post_id]);
  
  // Handle video ready
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onReady(review.post_id);
    }
  }, [review.post_id, onReady]);
  
  // Control playback based on active state
  useEffect(() => {
    if (!playerRef.current) return;
    
    if (isActive && isVideoReady) {
      playerRef.current.play()?.catch(() => {});
    } else {
      playerRef.current.pause();
    }
  }, [isActive, isVideoReady]);
  
  // Truncate review text for quote
  const reviewSnippet = useMemo(() => {
    if (!review.review_text) return '';
    return review.review_text.length > 100 
      ? review.review_text.slice(0, 100) + '...'
      : review.review_text;
  }, [review.review_text]);
  
  return (
    <div
      className={cn(
        "relative w-full aspect-[16/10] transition-opacity duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none absolute inset-0"
      )}
    >
      {/* Media layer */}
      <div className="absolute inset-0">
        {/* Video background */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isVideoReady ? "opacity-100" : "opacity-0"
        )}>
          {hlsUrl && (
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              autoplay={false}
              muted
              loop
              className="h-full w-full object-cover"
              onCanPlayThrough={handleCanPlayThrough}
            />
          )}
        </div>
        
        {/* Poster/Thumbnail as fallback */}
        {!isVideoReady && (posterUrl || review.thumbnail_url) && (
          <img
            src={posterUrl || review.thumbnail_url || ''}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        
        {/* Skeleton until video ready */}
        {!isVideoReady && !posterUrl && !review.thumbnail_url && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Top overlay: badge + rating */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div className="backdrop-blur-md bg-black/35 border border-white/10 rounded-full px-3 py-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Trophy className="w-4 h-4" aria-hidden />
            Review of the Week
          </span>
        </div>

        <div className="backdrop-blur-md bg-black/35 border border-white/10 rounded-full px-3 py-2">
          <span 
            className="text-sm font-semibold"
            style={{ 
              color: review.rating >= 9.0 ? '#fbbf24' : '#ffffff',
            }}
          >
            {review.rating === 10 ? '10' : review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Bottom overlay: gradient scrim + info */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        {/* Gradient scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        <div className="relative p-4 pt-10">
          {/* Quote (optional, 2 lines max) */}
          {reviewSnippet && (
            <p className="mb-2 line-clamp-2 text-sm text-white/85 italic">
              "{reviewSnippet}"
            </p>
          )}

          {/* Course name (1 line) */}
          <div className="mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/80 flex-shrink-0" aria-hidden />
            <h3 className="line-clamp-1 text-lg font-semibold text-white">
              {review.course_name}
            </h3>
          </div>

          {/* Region line (1 line) */}
          <p className="mb-3 line-clamp-1 text-sm text-white/70">
            {review.course_location}
          </p>

          {/* Action row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar className="h-8 w-8 border border-white/15">
                <AvatarImage src={review.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-zinc-700 text-white text-xs">
                  {review.display_name?.charAt(0) || review.username?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 line-clamp-1 text-sm font-medium text-white/90">
                {review.display_name || review.username}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTap();
              }}
              className="shrink-0 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white
                         border border-white/15 backdrop-blur-md active:scale-[0.98] transition-transform"
            >
              View Review <ChevronRight className="w-4 h-4 inline" aria-hidden />
            </button>
          </div>

          {/* Carousel dots */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onGoToSlide(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentIndex ? "w-6 bg-white/90" : "w-1.5 bg-white/35"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.review.post_id === next.review.post_id &&
    prev.isActive === next.isActive &&
    prev.isVideoReady === next.isVideoReady &&
    prev.currentIndex === next.currentIndex &&
    prev.totalSlides === next.totalSlides
  );
});

export default ReviewsOfTheWeekHero;
