/**
 * FullscreenMediaItem - Single media item display with multi-media carousel navigation
 * 
 * Renders either video or image with chevron navigation, dot indicators, and swipe support.
 * Includes blurred background for letterboxing when aspect ratio doesn't fill the screen.
 * 
 * Performance Fixes:
 * - Fix 1: MediaRuntime registration (surface="fullscreen", managedByMediaRuntime=true)
 * - Fix 2: Error state with retry UI
 * - Fix 3: Play-gated poster-to-video crossfade
 * - Fix 4: Explicit pause on swipe-away
 * - Fix 6: Smart loop logic (≥60s no loop, end state)
 * - Fix 8: Single-tap play/pause with double-tap coexistence
 */

import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '../components/UnifiedVideoPlayer';
import { UnifiedImage } from '../components/UnifiedImage';
import { FullscreenMediaItem as FullscreenMediaItemType, FullscreenMediaItemMedia } from '../hooks/useFullscreenViewer';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import CarouselDots from '@/components/posts/CarouselDots';
import { BlurredMediaBackground } from '@/components/media/BlurredMediaBackground';
import { AnimatePresence, motion } from 'framer-motion';

// Smart loop threshold: videos under this duration loop, others don't
const LOOP_DURATION_THRESHOLD = 60; // seconds

export interface FullscreenMediaItemProps {
  item: FullscreenMediaItemType;
  isActive?: boolean;
  isNearby?: boolean;
  className?: string;
}

export const FullscreenMediaItem: React.FC<FullscreenMediaItemProps> = React.memo(({
  item,
  isActive = false,
  isNearby = true,
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const lastTapRef = useRef<number>(0);
  const [showHeart, setShowHeart] = useState(false);
  
  // Fix 8: Single-tap play/pause state
  const [tapIcon, setTapIcon] = useState<'play' | 'pause' | null>(null);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Player ref to get video element
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  // Store the video element ref for context registration
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const {
    currentMediaIndex,
    totalMediaInPost,
    currentMediaItem,
    nextMedia,
    prevMedia,
    goToMedia,
    hasNextMedia,
    hasPrevMedia,
    isBootstrapping,
    setActiveVideoRef,
  } = viewer;

  // Fix 3: Seek to startAt on first play for resume
  const hasAppliedStartAt = useRef(false);
  useEffect(() => {
    if (!isActive || !viewer.startAt || hasAppliedStartAt.current) return;
    const videoEl = playerRef.current?.getVideoElement();
    if (videoEl && videoEl.readyState >= 1) {
      videoEl.currentTime = viewer.startAt;
      hasAppliedStartAt.current = true;
    } else if (videoEl) {
      const onLoaded = () => {
        if (viewer.startAt) videoEl.currentTime = viewer.startAt;
        hasAppliedStartAt.current = true;
        videoEl.removeEventListener('loadedmetadata', onLoaded);
      };
      videoEl.addEventListener('loadedmetadata', onLoaded);
      return () => videoEl.removeEventListener('loadedmetadata', onLoaded);
    }
  }, [isActive, viewer.startAt]);

  const hasMultipleMedia = totalMediaInPost > 1;

  // Register video element with context when active
  useEffect(() => {
    if (isActive && playerRef.current) {
      const videoEl = playerRef.current.getVideoElement();
      if (videoEl) {
        videoElementRef.current = videoEl;
        const refObject = { current: videoEl };
        setActiveVideoRef(refObject);
      }
    }
    
    return () => {
      if (isActive) {
        setActiveVideoRef(null);
        videoElementRef.current = null;
      }
    };
  }, [isActive, setActiveVideoRef]);

  // Fix 4: Explicit pause on swipe-away
  useEffect(() => {
    if (!isActive) {
      const videoEl = playerRef.current?.getVideoElement();
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
    }
  }, [isActive]);

  // Cleanup single-tap timer on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  // Swipe handlers for horizontal navigation within post
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (hasNextMedia) {
        nextMedia();
      }
    },
    onSwipedRight: () => {
      if (hasPrevMedia) {
        prevMedia();
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true,
  });

  // Handle chevron clicks
  const handlePrevClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    prevMedia();
  }, [prevMedia]);

  const handleNextClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    nextMedia();
  }, [nextMedia]);

  // Handle dot clicks
  const handleDotClick = useCallback((index: number) => {
    goToMedia(index);
  }, [goToMedia]);

  // Fix 8: Single-tap play/pause + double-tap to like
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected — cancel single-tap timer
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      e.preventDefault();
      e.stopPropagation();
      
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 450);
    } else {
      // Potential single tap — wait 250ms to confirm
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        const videoEl = playerRef.current?.getVideoElement();
        if (!videoEl) return;
        
        if (videoEl.paused) {
          videoEl.play().catch(() => {});
          setTapIcon('play');
        } else {
          videoEl.pause();
          setTapIcon('pause');
        }
        setTimeout(() => setTapIcon(null), 600);
      }, 250);
    }
  }, []);

  // Get the media to display - use currentMediaItem from viewer
  const displayMedia: FullscreenMediaItemMedia = currentMediaItem || {
    id: item.id,
    mediaUrl: item.mediaUrl,
    mediaType: item.mediaType,
    streamId: item.streamId,
    posterUrl: item.posterUrl,
    aspectRatio: item.aspectRatio,
    studioEdits: item.studioEdits,
  };

  // Get blur background URL from poster or media URL
  const blurBackgroundUrl = useMemo(() => {
    return displayMedia.posterUrl || displayMedia.mediaUrl || '';
  }, [displayMedia]);

  // Autoplay only when active AND not bootstrapping
  const shouldAutoplay = isActive && !isBootstrapping;

  // Fix 6: Smart loop — determine based on item duration
  const shouldLoop = useMemo(() => {
    const duration = item.duration;
    if (typeof duration === 'number' && duration >= LOOP_DURATION_THRESHOLD) {
      return false;
    }
    return true; // default loop for shorts or unknown duration
  }, [item.duration]);

  return (
    <div
      {...swipeHandlers}
      className={cn('relative w-full h-full bg-black overflow-hidden', className)}
      onClick={handleTap}
    >
      {/* Blurred background for letterboxing effect */}
      {blurBackgroundUrl && (
        <BlurredMediaBackground 
          src={blurBackgroundUrl}
          isVideo={displayMedia.mediaType === 'video'}
          className="opacity-40"
        />
      )}

      {/* Double-tap heart burst */}
      {showHeart && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50">
          <div className="text-white opacity-0 scale-75 animate-[heart-burst_0.45s_ease-out_forwards]">
            <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
      )}

      {/* Fix 8: Single-tap play/pause icon */}
      <AnimatePresence>
        {tapIcon && (
          <motion.div
            key="tap-icon"
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center z-50"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              {tapIcon === 'play' ? (
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              ) : (
                <Pause className="w-8 h-8 text-white" fill="white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media content - z-[1] to appear above blur background */}
      <div className="relative z-[1] w-full h-full">
        <SingleMediaDisplay
          media={displayMedia}
          isActive={isActive}
          isNearby={isNearby}
          muted={viewer.isMuted}
          caption={item.caption}
          shouldAutoplay={shouldAutoplay}
          shouldLoop={shouldLoop}
          playerRef={playerRef}
          itemDuration={item.duration}
        />
      </div>

      {/* Navigation Chevrons - Only show if multiple media */}
      {hasMultipleMedia && (
        <>
          {/* Left Chevron */}
          {hasPrevMedia && (
            <button
              onClick={handlePrevClick}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 hover:bg-black/60 transition-colors"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Right Chevron */}
          {hasNextMedia && (
            <button
              onClick={handleNextClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white/90 hover:bg-black/60 transition-colors"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Dot Indicators - positioned above bottom gradient */}
          <div className="absolute bottom-[38vh] left-0 right-0 z-30 flex justify-center">
            <CarouselDots
              count={totalMediaInPost}
              activeIndex={currentMediaIndex}
              onDotClick={handleDotClick}
            />
          </div>
        </>
      )}

      {/* Readability gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: '35vh',
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)',
        }}
      />
    </div>
  );
});

// ============ Single Media Display ============

interface SingleMediaDisplayProps {
  media: FullscreenMediaItemMedia;
  isActive: boolean;
  isNearby: boolean;
  muted: boolean;
  caption?: string;
  shouldAutoplay: boolean;
  shouldLoop: boolean;
  playerRef: React.RefObject<UnifiedVideoPlayerRef>;
  itemDuration?: number;
}

export const SingleMediaDisplay: React.FC<SingleMediaDisplayProps> = React.memo(({
  media,
  isActive,
  isNearby,
  muted,
  caption,
  shouldAutoplay,
  shouldLoop,
  playerRef,
  itemDuration,
}) => {
  // Fix 2: Error state
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  
  // Fix 3: Play-gated poster crossfade
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fix 6: Video ended state
  const [hasEnded, setHasEnded] = useState(false);

  // Reset states when media changes
  useEffect(() => {
    setIsVideoPlaying(false);
    setPosterLoaded(false);
    setHasError(false);
    setHasEnded(false);
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
    }
  }, [media.id, retryKey]);

  // Fix 6: Listen for video ended event
  useEffect(() => {
    if (media.mediaType !== 'video' || shouldLoop || !isActive) return;
    const videoEl = playerRef.current?.getVideoElement();
    if (!videoEl) return;
    
    const onEnded = () => setHasEnded(true);
    videoEl.addEventListener('ended', onEnded);
    return () => videoEl.removeEventListener('ended', onEnded);
  }, [media.mediaType, shouldLoop, isActive, retryKey]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  // Fix 3: onPlay callback — 100ms buffer then reveal video
  const handlePlay = useCallback(() => {
    setHasEnded(false);
    playTimerRef.current = setTimeout(() => {
      setIsVideoPlaying(true);
    }, 100);
  }, []);

  // Fix 2: Error handler
  const handleError = useCallback(() => {
    setHasError(true);
    setIsVideoPlaying(false);
  }, []);

  // Fix 2: Retry handler — remount player
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsVideoPlaying(false);
    setHasEnded(false);
    setRetryKey(prev => prev + 1);
  }, []);

  // Fix 6: Replay handler
  const handleReplay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const videoEl = playerRef.current?.getVideoElement();
    if (videoEl) {
      videoEl.currentTime = 0;
      videoEl.play().catch(() => {});
      setHasEnded(false);
    }
  }, []);

  if (media.mediaType === 'video') {
    return (
      <div className="absolute inset-0 w-full h-full">
        {/* Fix 3: Poster overlay — stays until video is playing */}
        {media.posterUrl && (
          <div
            className="absolute inset-0 z-[2] transition-opacity duration-150"
            style={{ opacity: isVideoPlaying && !hasError && !hasEnded ? 0 : 1 }}
          >
            <img
              src={media.posterUrl}
              alt=""
              className={cn(
                'w-full h-full object-cover transition-opacity duration-200',
                posterLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setPosterLoaded(true)}
              draggable={false}
            />
            {/* Shimmer while poster loads */}
            {!posterLoaded && (
              <div className="absolute inset-0 bg-muted/50 animate-pulse" />
            )}
          </div>
        )}

        {/* Shimmer if no poster URL */}
        {!media.posterUrl && !isVideoPlaying && (
          <div className="absolute inset-0 z-[2] bg-muted/50 animate-pulse" />
        )}

        {/* Video player */}
        {!hasError && (
          <UnifiedVideoPlayer
            key={retryKey}
            ref={playerRef}
            src={media.mediaUrl}
            posterUrl={media.posterUrl}
            muted={muted}
            autoplay={shouldAutoplay}
            loop={shouldLoop}
            controls={false}
            className="absolute inset-0 w-full h-full z-[1]"
            objectFit="cover"
            managedByMediaRuntime={true}
            surface="fullscreen"
            preload={isActive ? 'auto' : 'metadata'}
            onPlay={handlePlay}
            onError={handleError}
          />
        )}

        {/* Fix 2: Error state with retry */}
        {hasError && (
          <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-black/50" />
            <button
              onClick={handleRetry}
              className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <p className="relative z-10 text-white/60 text-sm mt-3">Tap to retry</p>
          </div>
        )}

        {/* Fix 6: End state for long-form videos */}
        {hasEnded && !hasError && (
          <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center">
            <button
              onClick={handleReplay}
              className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
            <p className="relative z-10 text-white/60 text-sm mt-3">Swipe for next</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <UnifiedImage
      src={media.mediaUrl}
      alt={caption || ''}
      className="absolute inset-0 w-full h-full"
      objectFit="cover"
      priority={isActive}
    />
  );
});

export default FullscreenMediaItem;
