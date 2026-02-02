/**
 * FullscreenMediaItem - Single media item display with multi-media carousel navigation
 * 
 * Renders either video or image with chevron navigation, dot indicators, and swipe support.
 * Includes blurred background for letterboxing when aspect ratio doesn't fill the screen.
 * 
 * FIXES INCLUDED:
 * - Fix 2: Bootstrap-aware autoplay (waits for isBootstrapping to be false)
 * - Fix 3: Registers video element with context for controls via player ref
 * - Fix 4D: Debug logging for multi-media (can be removed after testing)
 */

import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '../components/UnifiedVideoPlayer';
import { UnifiedImage } from '../components/UnifiedImage';
import { FullscreenMediaItem as FullscreenMediaItemType, FullscreenMediaItemMedia } from '../hooks/useFullscreenViewer';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import CarouselDots from '@/components/posts/CarouselDots';
import { BlurredMediaBackground } from '@/components/media/BlurredMediaBackground';

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
  
  // FIX 3: Player ref to get video element
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

  const hasMultipleMedia = totalMediaInPost > 1;

  // FIX 3: Register video element with context when active
  // We get the video element from the player ref and create a ref object for it
  useEffect(() => {
    if (isActive && playerRef.current) {
      const videoEl = playerRef.current.getVideoElement();
      if (videoEl) {
        // Create a ref-like object that points to the video element
        videoElementRef.current = videoEl;
        // Create a proper ref object to pass to context
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

  // FIX 4D: Debug logging for multi-media issues (remove after testing)
  useEffect(() => {
    if (isActive) {
      console.log('[FullscreenMediaItem] Multi-media debug:', {
        itemId: item.id,
        allMedia: item.allMedia,
        allMediaLength: item.allMedia?.length,
        hasMultipleMedia,
        totalMediaInPost,
        currentMediaIndex,
      });
    }
  }, [item, isActive, hasMultipleMedia, totalMediaInPost, currentMediaIndex]);

  // Swipe handlers for horizontal navigation within post
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (hasNextMedia) {
        console.log('[FullscreenMediaItem] Swipe left - nextMedia');
        nextMedia();
      }
    },
    onSwipedRight: () => {
      if (hasPrevMedia) {
        console.log('[FullscreenMediaItem] Swipe right - prevMedia');
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

  // Double-tap to like
  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault();
      e.stopPropagation();
      
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 450);
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

  // Determine if media needs letterboxing (non-portrait content in vertical feed)
  const needsBlurBackground = useMemo(() => {
    // Default to showing blur background for all content to handle various aspect ratios
    // In fullscreen mode, blur background helps with letterboxed content
    return true;
  }, []);

  // FIX 2: Autoplay only when active AND not bootstrapping
  const shouldAutoplay = isActive && !isBootstrapping;

  return (
    <div
      {...swipeHandlers}
      className={cn('relative w-full h-full bg-black overflow-hidden', className)}
      onClick={handleTap}
    >
      {/* Blurred background for letterboxing effect */}
      {needsBlurBackground && blurBackgroundUrl && (
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

      {/* Media content - z-[1] to appear above blur background */}
      <div className="relative z-[1] w-full h-full">
        <SingleMediaDisplay
          media={displayMedia}
          isActive={isActive}
          isNearby={isNearby}
          muted={viewer.isMuted}
          caption={item.caption}
          shouldAutoplay={shouldAutoplay}
          playerRef={playerRef}
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
  playerRef: React.RefObject<UnifiedVideoPlayerRef>;
}

export const SingleMediaDisplay: React.FC<SingleMediaDisplayProps> = React.memo(({
  media,
  isActive,
  isNearby,
  muted,
  caption,
  shouldAutoplay,
  playerRef,
}) => {
  if (media.mediaType === 'video') {
    return (
      <UnifiedVideoPlayer
        ref={playerRef}
        src={media.mediaUrl}
        posterUrl={media.posterUrl}
        muted={muted}
        autoplay={shouldAutoplay}
        loop
        controls={false}
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
        managedByMediaRuntime={false}
        preload={isNearby ? 'auto' : 'metadata'}
      />
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
