/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Direct UnifiedVideoPlayer (no legacy wrapper)
 * - 50%/10% hysteresis autoplay via IntersectionObserver
 * - 150ms crossfade poster→video transition
 * - Priority poster loading for first 6 cards
 * - Source stability, HLS pool, buffering debounce via UnifiedVideoPlayer
 * - MediaRuntime integration for decoder/resource management
 * - Poster fade-in on load, poster stays until video plays
 */

import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
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
  /** Whether the current user has liked this post */
  isLikedByMe?: boolean;
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
  /** Whether this card is eligible for autoplay (diagonal pattern - 1 per row) */
  isAutoplayCandidate?: boolean;
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const WatchShortCard = React.memo(function WatchShortCard({ 
  video, 
  index, 
  onTap, 
  isLikedByMe = false,
  shouldMountVideo = false,
  isVisible = false,
  isVideoReady = false,
  onFirstFrameReady,
  isPriority = false,
  isAutoplayCandidate = true,
}: WatchShortCardProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  
  // P0: Hysteresis-based autoplay state (50% start, 10% stop)
  const [shouldPlay, setShouldPlay] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const primaryMedia = video.media[0];
  const mediaUrl = primaryMedia?.media_url;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const durationSeconds = primaryMedia?.duration_seconds;

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

  // Reset state when video changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setHasFirstFrame(false);
    setShouldPlay(false);
    setPosterLoaded(false);
    setIsPlaying(false);
  }, [video.id]);

  // Fix 4: Preload poster for first 6 tiles
  useEffect(() => {
    if (!isPriority || !posterUrl) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = posterUrl;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [isPriority, posterUrl]);

  // ============================================================================
  // P0: HYSTERESIS AUTOPLAY - 50% to start, 10% to stop
  // Only applies to autoplay candidates (diagonal pattern - 1 per row)
  // ============================================================================
  useEffect(() => {
    const container = containerRef.current;
    // Skip autoplay observer entirely for non-candidates
    if (!container || !shouldMountVideo || !hlsUrl || !isAutoplayCandidate) return;

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
  }, [shouldMountVideo, hlsUrl, isAutoplayCandidate]);

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

  // Handle play event — poster can now fade out
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
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

  // Poster image loaded handler
  const handlePosterLoad = useCallback(() => {
    setPosterLoaded(true);
  }, []);

  // Guard: hide tile if no primary media AND no poster available
  if (!primaryMedia) return null;
  if (!posterUrl && !hlsUrl) return null;

  // Determine if poster should be visible:
  // Poster stays visible until video is playing with first frame ready
  const videoIsReady = hasFirstFrame && isPlaying && shouldMountVideo;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "will-change-transform"
      )}
      onClick={onTap}
      tabIndex={0}
      role="button"
      aria-label={`Watch video by ${creator?.display_name || 'Golfer'}`}
      aria-busy={!hasFirstFrame && shouldMountVideo}
       onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      {/* Shimmer loading placeholder — stays until poster fades in on top */}
      <div className="absolute inset-0 bg-muted/50 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      
      {/* Poster with fade-in on load, stays until video plays */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover z-10",
            "transition-opacity duration-200 ease-out",
            // Fade in when poster loads
            posterLoaded ? "opacity-100" : "opacity-0",
            // Fade out only when video is playing with first frame
            videoIsReady && "!opacity-0 duration-150"
          )}
          loading={isPriority ? "eager" : "lazy"}
          fetchPriority={isPriority ? "high" : "auto"}
          decoding="async"
          onLoad={handlePosterLoad}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
          }}
        />
      )}

      {/* Video Player — Fix 1 & 2: MediaRuntime integration + watch-shorts surface */}
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
            autoplay={false}
            showMuteButton={false}
            showPlayButton={false}
            scrubber={false}
            objectFit="cover"
            className="absolute inset-0 w-full h-full"
            surface="watch-shorts"
            managedByMediaRuntime={true}
            mediaId={streamId}
            preload="auto"
            onLoadedData={handleLoadedData}
            onCanPlayThrough={handleCanPlayThrough}
            onPlay={handlePlay}
            onError={handleError}
          />
        </div>
      )}

      {/* Gradient Overlay - Bottom 30% */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-20" />

      {/* Like Count Badge - Top Right - Only show when like_count > 0 */}
      {likeCount > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/30 backdrop-blur-sm rounded-full z-30">
          <Heart className={cn("w-3 h-3", isLikedByMe ? "fill-like text-like" : "fill-like text-like")} />
          <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
        </div>
      )}

      {/* Fix 5: Duration Badge - Bottom Right */}
      {durationSeconds != null && durationSeconds > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 z-30">
          <span className="text-[10px] font-medium text-white">
            {formatDuration(durationSeconds)}
          </span>
        </div>
      )}

      {/* Creator Name - Bottom */}
      <div className="absolute bottom-2 left-2 right-14 z-30">
        {(creator?.display_name || creator?.username) && (
          <p className="text-white text-sm font-medium truncate">
            {creator?.display_name || creator?.username}
          </p>
        )}
        {(video as any).golf_courses?.name && (
          <p className="text-white/60 text-[10px] leading-tight truncate">
            {(video as any).golf_courses.name}
          </p>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.like_count === nextProps.video.like_count &&
    prevProps.index === nextProps.index &&
    prevProps.isLikedByMe === nextProps.isLikedByMe &&
    prevProps.shouldMountVideo === nextProps.shouldMountVideo &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate
  );
});

export default WatchShortCard;
