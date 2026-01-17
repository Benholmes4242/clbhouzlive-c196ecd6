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
        "relative w-full aspect-square overflow-hidden",
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
        />
      ))}
      
      {/* Pagination dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex
                ? "bg-white w-6"
                : "bg-white/50 hover:bg-white/70 w-2"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
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
}

const ReviewSlide = React.memo(function ReviewSlide({
  review,
  isActive,
  isVideoReady,
  onReady,
  onTap,
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
  
  // Truncate review text
  const reviewSnippet = useMemo(() => {
    if (!review.review_text) return '';
    return review.review_text.length > 70 
      ? review.review_text.slice(0, 70) + '...'
      : review.review_text;
  }, [review.review_text]);
  
  return (
    <div
      onClick={onTap}
      className={cn(
        "absolute inset-0 transition-opacity duration-500 cursor-pointer",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
      )}
    >
      {/* Video background - always mounted, opacity controlled */}
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
            className="absolute inset-0 w-full h-full object-cover"
            onCanPlayThrough={handleCanPlayThrough}
          />
        )}
      </div>
      
      {/* Poster/Thumbnail as fallback */}
      {!isVideoReady && (posterUrl || review.thumbnail_url) && (
        <img
          src={posterUrl || review.thumbnail_url || ''}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Skeleton until video ready */}
      {!isVideoReady && !posterUrl && !review.thumbnail_url && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Badge - top left - color matches rating (gold for 9+, slate for others) */}
      <div className="absolute top-4 left-4 z-20">
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg"
          style={{
            backgroundColor: review.rating >= 9.0 ? '#f59e0b' : 'rgba(100, 116, 139, 0.9)',
          }}
        >
          <Trophy className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-white">Review of the Week</span>
        </div>
      </div>
      
      {/* Rating badge - top right - uses gold for 9+, grey for others (matching review posts) */}
      <div className="absolute top-4 right-4 z-20">
        <div 
          className="flex flex-col items-center px-2.5 py-1.5 backdrop-blur-sm rounded-lg"
          style={{
            backgroundColor: review.rating >= 9.0 
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(0, 0, 0, 0.5)',
            border: review.rating >= 9.0
              ? '1px solid rgba(245, 158, 11, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span 
            className="text-lg font-bold tabular-nums leading-none"
            style={{ color: review.rating >= 9.0 ? '#fbbf24' : '#c4c8ce' }}
          >
            {review.rating === 10 ? '10' : review.rating.toFixed(1)}
          </span>
        </div>
      </div>
      
      {/* Content overlay - bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 pb-12 z-20">
        
        {/* Review snippet */}
        {reviewSnippet && (
          <p className="text-white/90 text-sm mb-3 line-clamp-2 italic">
            "{reviewSnippet}"
          </p>
        )}
        
        {/* Course info */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="w-4 h-4 text-white/70 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-white font-semibold text-base leading-tight">{review.course_name}</p>
            <p className="text-white/70 text-sm">{review.course_location}</p>
          </div>
        </div>
        
        {/* Reviewer info + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-white/30">
              <AvatarImage src={review.avatar_url || undefined} />
              <AvatarFallback className="bg-zinc-700 text-white text-xs">
                {review.display_name?.charAt(0) || review.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-white/90 text-sm font-medium">
              {review.display_name || review.username}
            </span>
          </div>
          
          <button 
            className="flex items-center gap-1 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium hover:bg-white/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}
          >
            View Review
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.review.post_id === next.review.post_id &&
    prev.isActive === next.isActive &&
    prev.isVideoReady === next.isVideoReady
  );
});

export default ReviewsOfTheWeekHero;
