/**
 * ReviewsOfTheWeekHero - Hero carousel featuring top video reviews of the week
 * 
 * A* Polish: Cinematic cards with gradient overlays, premium rating badges,
 * refined dot indicators, 4:5 aspect ratio
 * 
 * Performance fixes to Clubhouse parity:
 * - Fix 1: Mount only active + next slide players (caps HLS to 2)
 * - Fix 2: MediaRuntime registration with surface="hero"
 * - Fix 3: Play-gated poster-to-video transition (onPlay, not canPlayThrough)
 * - Fix 4: Skeleton stays until first poster loads
 * - Fix 5: Shimmer layer + poster fade-in per slide
 * - Fix 6: Error state keeps poster visible (no error chrome)
 * - Fix 7: Poster preload link for first slide
 * - Fix 8: GlobalAudioContext integration
 * - Fix 9: Auto-advance progress bar indicator
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
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface ReviewsOfTheWeekHeroProps {
  onFallbackToFeaturedCourse?: () => void;
  className?: string;
}

const AUTO_ADVANCE_INTERVAL = 5000;
const PAUSE_AFTER_INTERACTION = 10000;

export function ReviewsOfTheWeekHero({ 
  onFallbackToFeaturedCourse,
  className 
}: ReviewsOfTheWeekHeroProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [firstPosterLoaded, setFirstPosterLoaded] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // Reset progress bar animation
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const hasFallenBack = useRef(false);
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const { isGloballyMuted } = useGlobalAudio();
  
  const { data: reviews, isLoading } = useReviewsOfTheWeek({ limit: 7 });
  
  // Fix 7: Poster preload link for first slide
  useEffect(() => {
    if (!reviews?.length) return;
    const firstReview = reviews[0];
    if (!firstReview?.video_url) return;
    const uid = uidFromNode({ src: firstReview.video_url });
    if (!uid) return;
    const posterUrl = generateStreamThumbnailUrl(uid, { width: 1280, height: 1600, time: 1 });
    if (!posterUrl || isPosterFailed(posterUrl)) return;
    
    const existingLink = document.querySelector(`link[href="${posterUrl}"]`);
    if (existingLink) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = posterUrl;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [reviews]);
  
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
  
  // Preload next slide HLS manifest
  useEffect(() => {
    if (!reviews?.length) return;
    const nextIndex = (currentIndex + 1) % reviews.length;
    const nextReview = reviews[nextIndex];
    if (!nextReview?.video_url) return;
    const uid = uidFromNode({ src: nextReview.video_url });
    if (uid) preloadHlsManifest(generateStreamHlsUrl(uid));
  }, [currentIndex, reviews]);
  
  // Fix 9: Auto-advance with progress bar reset
  useEffect(() => {
    if (!reviews?.length || isPaused || !isHeroVisible) return;
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
      setProgressKey(prev => prev + 1); // Reset progress bar
    }, AUTO_ADVANCE_INTERVAL);
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [reviews?.length, isPaused, isHeroVisible]);
  
  const handleInteraction = useCallback(() => {
    setIsPaused(true);
    setProgressKey(prev => prev + 1); // Reset progress bar
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      setProgressKey(prev => prev + 1); // Restart progress bar
    }, PAUSE_AFTER_INTERACTION);
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

  // Fix 4: Callback for first poster load
  const handleFirstPosterLoad = useCallback(() => {
    setFirstPosterLoaded(true);
  }, []);

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
  
  // Auto-advance is active (not paused and visible)
  const isAutoAdvancing = !isPaused && isHeroVisible;
  
  return (
    <div className={cn("pt-3 px-4", className)}>
      {/* Fix 4: Skeleton overlay that stays until first poster loads */}
      <div className="relative">
        <div 
          ref={heroContainerRef}
          {...swipeHandlers}
          className="relative w-full overflow-hidden rounded-2xl bg-muted will-change-transform"
        >
          {reviews.map((review, index) => (
            <ReviewSlide
              key={review.post_id}
              review={review}
              isActive={index === currentIndex}
              isNextSlide={index === (currentIndex + 1) % reviews.length}
              shouldMountVideo={index === currentIndex || index === (currentIndex + 1) % reviews.length}
              isHeroVisible={isHeroVisible}
              isGloballyMuted={isGloballyMuted}
              onTap={() => handleReviewTap(review)}
              currentIndex={currentIndex}
              totalSlides={reviews.length}
              onGoToSlide={goToSlide}
              onPosterLoad={index === 0 ? handleFirstPosterLoad : undefined}
              isAutoAdvancing={isAutoAdvancing}
              progressKey={progressKey}
            />
          ))}
        </div>
        
        {/* Fix 4: Skeleton stays until first poster loads — crossfade out */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-opacity duration-200",
            firstPosterLoaded ? "opacity-0" : "opacity-100"
          )}
        >
          <Skeleton className="w-full h-full animate-shimmer-down" />
        </div>
      </div>
    </div>
  );
}

// Individual slide component
interface ReviewSlideProps {
  review: ReviewOfTheWeek;
  isActive: boolean;
  isNextSlide: boolean;
  shouldMountVideo: boolean;
  isHeroVisible: boolean;
  isGloballyMuted: boolean;
  onTap: () => void;
  currentIndex: number;
  totalSlides: number;
  onGoToSlide: (index: number) => void;
  onPosterLoad?: () => void;
  isAutoAdvancing: boolean;
  progressKey: number;
}

const ReviewSlide = React.memo(function ReviewSlide({
  review,
  isActive,
  isNextSlide,
  shouldMountVideo,
  isHeroVisible,
  isGloballyMuted,
  onTap,
  currentIndex,
  totalSlides,
  onGoToSlide,
  onPosterLoad,
  isAutoAdvancing,
  progressKey,
}: ReviewSlideProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const hasReportedReadyRef = useRef(false);
  const isVideoReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<UnifiedVideoPlayerRef | null>(null);
  
  const shouldAutoplay = isActive && isHeroVisible;
  const rating = review.rating ?? 0;
  const theme = getReviewOverlayTheme(rating);
  const formattedRating = rating === 10 ? '10' : rating.toFixed(1);
  
  // Imperative play/pause control
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
  
  // Reset video readiness when slide changes identity
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
    setHasError(false);
    if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
  }, [review.post_id]);
  
  // Reset video readiness when player is unmounted (slide scrolled out of mount window)
  useEffect(() => {
    if (!shouldMountVideo) {
      hasReportedReadyRef.current = false;
      setIsVideoReady(false);
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    }
  }, [shouldMountVideo]);
  
  // Fix 3: Play-gated transition — onPlay + 100ms buffer
  const handlePlay = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      isVideoReadyTimerRef.current = setTimeout(() => {
        hasReportedReadyRef.current = true;
        setIsVideoReady(true);
      }, 100);
    }
  }, []);
  
  // Fix 6: Error handler — keep poster, log error, no chrome
  const handleError = useCallback(() => {
    console.warn('[ReviewsOfTheWeekHero] Video playback error for:', review.post_id);
    setHasError(true);
    setIsVideoReady(false);
  }, [review.post_id]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    };
  }, []);
  
  const isPrioritySlide = isActive || isNextSlide;
  
  // Fix 5: Poster load handler
  const handlePosterLoad = useCallback(() => {
    setPosterLoaded(true);
    onPosterLoad?.();
  }, [onPosterLoad]);

  const initials = useMemo(() => {
    return (review.display_name || review.username || 'G')
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [review.display_name, review.username]);
  
  // Determine if video layer should be visible
  const videoIsReady = isVideoReady && shouldAutoplay && shouldMountVideo && !hasError;
  
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
        {/* Fix 5: Shimmer base layer — always behind poster */}
        <div className="absolute inset-0 bg-muted animate-shimmer-down" />
        
        {/* Poster — fades in over shimmer */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-200",
              posterLoaded ? "opacity-100" : "opacity-0",
              // Fix 3: Poster fades out only when video is truly playing
              videoIsReady && "!opacity-0 !duration-150"
            )}
            loading={isPrioritySlide ? "eager" : "lazy"}
            fetchPriority={isPrioritySlide ? "high" : "auto"}
            decoding="async"
            onLoad={handlePosterLoad}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        
        {/* Fix 1: Only mount player for active + next slide */}
        {hlsUrl && shouldMountVideo && !hasError && (
          <div className="absolute inset-0 z-[2]">
            <UnifiedVideoPlayer
              key={retryKey}
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={shouldAutoplay}
              muted={isGloballyMuted}
              loop
              preload={isActive ? "auto" : "metadata"}
              showMuteButton={false}
              showPlayButton={false}
              scrubber={false}
              mediaId={streamId || undefined}
              className="h-full w-full object-cover"
              managedByMediaRuntime={true}
              surface="hero"
              onPlay={handlePlay}
              onError={handleError}
            />
          </div>
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

      {/* Fix 9: Auto-advance progress bar — thin bar at bottom */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-[2px]">
          <div
            key={progressKey}
            className={cn(
              "h-full bg-white/60 origin-left",
              isAutoAdvancing ? "animate-progress-fill" : "w-0"
            )}
            style={isAutoAdvancing ? { animationDuration: `${AUTO_ADVANCE_INTERVAL}ms` } : undefined}
          />
        </div>
      )}

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
    prev.shouldMountVideo === next.shouldMountVideo &&
    prev.isHeroVisible === next.isHeroVisible &&
    prev.isGloballyMuted === next.isGloballyMuted &&
    prev.currentIndex === next.currentIndex &&
    prev.totalSlides === next.totalSlides &&
    prev.isAutoAdvancing === next.isAutoAdvancing &&
    prev.progressKey === next.progressKey
  );
});

export default ReviewsOfTheWeekHero;
