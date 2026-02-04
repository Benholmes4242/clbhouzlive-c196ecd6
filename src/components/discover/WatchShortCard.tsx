/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Direct UnifiedVideoPlayer (no legacy wrapper)
 * - 50%/10% hysteresis autoplay via IntersectionObserver
 * - 150ms crossfade poster→video transition
 * - Priority poster loading for first 6 cards
 * - Source stability, HLS pool, buffering debounce via UnifiedVideoPlayer
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { Heart, Layers } from 'lucide-react';
import { WatchShort } from '@/hooks/useWatchShorts';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';

interface WatchShortCardProps {
  video: WatchShort;
  index: number;
  onTap: () => void;
  /** Whether video should be mounted (controlled by parent grid) */
  shouldMountVideo?: boolean;
  /** Whether card is visible in viewport */
  isVisible?: boolean;
  /** Whether video is ready (buffered) - from ready queue */
  isVideoReady?: boolean;
  /** Callback when video is buffered enough to play smoothly (for prefetch system) */
  onFirstFrameReady?: () => void;
  /** Whether this is a priority card (first 6) for eager loading */
  isPriority?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export const WatchShortCard = React.memo(function WatchShortCard({ 
  video, 
  index, 
  onTap, 
  shouldMountVideo = false,
  isVisible = false,
  isVideoReady = false,
  onFirstFrameReady,
  isPriority = false,
}: WatchShortCardProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  
  // P0: Hysteresis-based autoplay state (50% start, 10% stop)
  const [shouldPlay, setShouldPlay] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  const primaryMedia = video.media[0];
  const mediaUrl = primaryMedia?.media_url;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const hasMultipleMedia = video.media.length > 1;

  // CRITICAL: Extract stream UID for cache consistency
  const streamId = useMemo(() => {
    if (!mediaUrl) return video.id;
    return uidFromNode({ src: mediaUrl }) || video.id;
  }, [mediaUrl, video.id]);
  
  // Generate HLS URL and poster URL
  const hlsUrl = useMemo(() => streamId ? generateStreamHlsUrl(streamId) : null, [streamId]);
  const posterUrl = useMemo(() => {
    if (!streamId) return undefined;
    const generatedPosterUrl = generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' });
    return generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : undefined;
  }, [streamId]);

  // Reset ready flag when video changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setHasFirstFrame(false);
    setShouldPlay(false);
  }, [video.id]);

  // ============================================================================
  // P0: HYSTERESIS AUTOPLAY - 50% to start, 10% to stop
  // ============================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !shouldMountVideo || !hlsUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          // Start playing at 50% visibility
          if (!prev && ratio >= 0.5) {
            return true;
          }
          // Stop playing when below 10% visibility
          if (prev && ratio < 0.1) {
            return false;
          }
          return prev;
        });
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px',
      }
    );

    observer.observe(container);
    
    return () => {
      observer.disconnect();
    };
  }, [shouldMountVideo, hlsUrl]);

  // Control playback based on hysteresis state
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !shouldMountVideo) return;

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, shouldMountVideo]);

  // Handle loadeddata for first frame
  const handleLoadedData = useCallback(() => {
    setHasFirstFrame(true);
  }, []);

  // Use canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);

  const handleError = useCallback(() => {
    // Still report as "ready" so scroll isn't blocked
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);

  // Early return after all hooks
  if (!primaryMedia) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[3/4] overflow-hidden cursor-pointer bg-muted",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "will-change-transform" // P3: GPU acceleration for scroll performance
      )}
      onClick={onTap}
      tabIndex={0}
      role="button"
      aria-label={`Watch video by ${creator?.display_name || 'Golfer'}`}
      aria-busy={!hasFirstFrame && shouldMountVideo} // P3: Accessibility - loading state
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      {/* P1: Priority Poster with fetchPriority="high" for first 6 cards */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover z-10",
            "transition-opacity duration-150 ease-out",
            hasFirstFrame && shouldMountVideo ? "opacity-0" : "opacity-100"
          )}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
          }}
        />
      )}

      {/* 
        TIKTOK-LEVEL: Direct UnifiedVideoPlayer
        - Source stability guard
        - HLS pool promotion
        - Buffering debounce
        - Controlled autoplay via hysteresis (not autoplay prop)
      */}
      {shouldMountVideo && hlsUrl && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-150 ease-out",
            isVideoReady && hasFirstFrame ? "opacity-100" : "opacity-0"
          )}
        >
          <UnifiedVideoPlayer
            ref={playerRef}
            src={hlsUrl}
            posterUrl={posterUrl}
            muted
            loop
            // P0: Controlled autoplay via hysteresis (not autoplay prop)
            autoplay={false}
            showMuteButton={false}
            showPlayButton={false}
            scrubber={false}
            objectFit="cover"
            className="absolute inset-0 w-full h-full"
            surface="grid"
            managedByMediaRuntime={false}
            mediaId={streamId}
            preload="auto"
            onLoadedData={handleLoadedData}
            onCanPlayThrough={handleCanPlayThrough}
            onError={handleError}
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-20" />

      {/* Like Count - Top Right */}
      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
        <Heart className="w-3 h-3 text-white" />
        <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
      </div>

      {/* Multi-media Indicator - Top Left */}
      {hasMultipleMedia && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full z-30">
          <Layers className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-medium">+{video.media.length - 1}</span>
        </div>
      )}

      {/* Creator Name - Bottom */}
      <div className="absolute bottom-2 left-2 right-2 z-30">
        <p className="text-white text-sm font-medium truncate">
          {creator?.display_name || 'Golfer'}
        </p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.like_count === nextProps.video.like_count &&
    prevProps.index === nextProps.index &&
    prevProps.shouldMountVideo === nextProps.shouldMountVideo &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.isPriority === nextProps.isPriority
  );
});

export default WatchShortCard;
