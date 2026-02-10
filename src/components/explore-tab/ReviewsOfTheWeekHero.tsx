/**
 * ReviewsOfTheWeekHero - Hero carousel featuring top video reviews of the week
 * 
 * A* Polish: Cinematic cards with gradient overlays, premium rating badges,
 * refined dot indicators, 4:5 aspect ratio
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { UnifiedVideoPlayer, type UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { useReviewsOfTheWeek, ReviewOfTheWeek } from '@/hooks/useReviewsOfTheWeek';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { Skeleton } from '@/components/ui/skeleton';
import { getReviewOverlayTheme } from '@/lib/postHelpers';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ChevronRight } from 'lucide-react';

interface ReviewsOfTheWeekHeroProps {
  onFallbackToFeaturedCourse?: () => void;
  className?: string;
}

const AUTO_ADVANCE_INTERVAL = 5000;
const PAUSE_AFTER_INTERACTION = 10000;
const FIRST_FRAME_FALLBACK_MS = 3000;

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
  
  const { data: reviews, isLoading } = useReviewsOfTheWeek({ limit: 7 });
  
  // P0: Viewport-aware hysteresis
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
      { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1.0], rootMargin: '0px' }
    );
    observer.observe(heroContainerRef.current);
    return () => observer.disconnect();
  }, []);
  
  // Preload next slide
  useEffect(() => {
    if (!reviews?.length) return;
    const nextIndex = (currentIndex + 1) % reviews.length;
    const nextReview = reviews[nextIndex];
    if (!nextReview?.video_url) return;
    const uid = uidFromNode({ src: nextReview.video_url });
    if (uid) preloadHlsManifest(generateStreamHlsUrl(uid));
  }, [currentIndex, reviews]);
  
  // Auto-advance
  useEffect(() => {
    if (!reviews?.length || isPaused || !isHeroVisible) return;
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, AUTO_ADVANCE_INTERVAL);
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [reviews?.length, isPaused, isHeroVisible]);
  
  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), PAUSE_AFTER_INTERACTION);
  }, []);
  
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
  
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goNext,
    onSwipedRight: goPrev,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });
  
  const handleReviewTap = useCallback((review: ReviewOfTheWeek) => {
    navigate(`/post/${review.post_id}`);
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && !reviews?.length && !hasFallenBack.current) {
      hasFallenBack.current = true;
      onFallbackToFeaturedCourse?.();
    }
  }, [isLoading, reviews?.length, onFallbackToFeaturedCourse]);
  
  if (isLoading) {
    return (
      <div className={cn("pt-3 px-4", className)}>
        <Skeleton className="w-full aspect-[4/5] rounded-2xl animate-shimmer-down" />
      </div>
    );
  }
  
  if (!reviews?.length) return null;
  
  return (
    <div className={cn("pt-3 px-4", className)}>
      <div 
        ref={heroContainerRef}
        {...swipeHandlers}
        className="relative w-full overflow-hidden rounded-2xl bg-black will-change-transform"
      >
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
  const playerRef = useRef<UnifiedVideoPlayerRef | null>(null);
  
  const shouldAutoplay = isActive && isHeroVisible;
  const rating = review.rating ?? 0;
  const isOutstanding = rating >= 9.0;
  const theme = getReviewOverlayTheme(rating);
  const formattedRating = rating === 10 ? '10' : rating.toFixed(1);
  
  useEffect(() => {
    if (!playerRef.current) return;
    if (shouldAutoplay) {
      playerRef.current.play().catch(() => {});
    } else {
      playerRef.current.pause();
    }
  }, [shouldAutoplay]);
  
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!review.video_url) return { hlsUrl: null, posterUrl: null, streamId: null };
    const extractedStreamId = uidFromNode({ src: review.video_url });
    if (!extractedStreamId) return { hlsUrl: null, posterUrl: review.thumbnail_url, streamId: null };
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { width: 1280, height: 1600, time: 1 });
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl : review.thumbnail_url;
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [review.video_url, review.thumbnail_url]);
  
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
    if (firstFrameTimeoutRef.current) clearTimeout(firstFrameTimeoutRef.current);
  }, [review.post_id]);
  
  useEffect(() => {
    if (isActive && hlsUrl && !isVideoReady) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!hasReportedReadyRef.current) {
          hasReportedReadyRef.current = true;
          setIsVideoReady(true);
        }
      }, FIRST_FRAME_FALLBACK_MS);
      return () => { if (firstFrameTimeoutRef.current) clearTimeout(firstFrameTimeoutRef.current); };
    }
  }, [isActive, hlsUrl, isVideoReady]);
  
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
      if (firstFrameTimeoutRef.current) clearTimeout(firstFrameTimeoutRef.current);
    }
  }, []);
  
  const isPrioritySlide = isActive || isNextSlide;

  const initials = useMemo(() => {
    return (review.display_name || review.username || 'G')
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [review.display_name, review.username]);
  
  return (
    <div
      className={cn(
        "relative w-full aspect-[4/5] motion-safe:transition-opacity motion-safe:duration-500",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none absolute inset-0"
      )}
      onClick={onTap}
      aria-busy={isActive && !isVideoReady}
    >
      {/* Media layer */}
      <div className="absolute inset-0">
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={isPrioritySlide ? "eager" : "lazy"}
            fetchPriority={isPrioritySlide ? "high" : "auto"}
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        
        {hlsUrl && (
          <div className={cn(
            "absolute inset-0 motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              ref={playerRef}
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
        
        {!isVideoReady && !posterUrl && (
          <Skeleton className="absolute inset-0 animate-shimmer-down" aria-busy="true" />
        )}
      </div>

      {/* Bottom gradient overlay — cinematic 45% coverage */}
      <div 
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10" 
        style={{ 
          height: '45%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)'
        }} 
      />
      
      {/* Top subtle gradient for rating badge legibility */}
      <div 
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{
          height: '30%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)'
        }}
      />

      {/* Rating Badge — top-right, premium glass */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <div 
          className="flex flex-col items-center rounded-xl px-3 py-2"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.20)',
          }}
        >
          <span 
            className="text-2xl font-bold tabular-nums leading-none text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {formattedRating}
          </span>
          <span 
            className="text-[10px] font-medium text-white/80 mt-0.5"
          >
            {theme.label}
          </span>
        </div>
      </div>

      {/* Bottom content — course name + location + reviewer */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4">
        {/* Course info */}
        <h3 
          className="text-xl font-bold text-white leading-tight line-clamp-2"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}
        >
          {review.course_name}
        </h3>
        {review.course_location && (
          <p className="text-sm text-white/70 mt-0.5 line-clamp-1">
            {review.course_location}
          </p>
        )}
        
        {/* Reviewer row */}
        <div className="flex items-center gap-2 mt-3">
          <SquircleAvatar
            size={32}
            src={review.avatar_url}
            alt={review.display_name || review.username || 'Golfer'}
            fallback={initials}
            hideRing
            className="border-2 border-white/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {review.display_name || review.username}
            </p>
            <div className="flex items-center gap-0.5 text-xs text-white/60">
              <span>Read review</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators — bottom-right, minimal pill style */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 pointer-events-auto">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onGoToSlide(i);
            }}
            className={cn(
              "h-[6px] rounded-full motion-safe:transition-all",
              i === currentIndex 
                ? "w-5 bg-white" 
                : "w-[6px] bg-white/40"
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
