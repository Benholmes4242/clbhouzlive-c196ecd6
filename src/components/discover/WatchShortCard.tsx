/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid's VideoWithAutoplay component for consistent
 * autoplay behavior across all surfaces.
 * 
 * INSTANT VIDEO PATTERN:
 * - Uses managedByMediaRuntime={false}, externallyManaged={false}
 * - Uses autoplay={true} with visibility-based triggering
 * - Uses preload="auto" for instant buffering
 * - Direct browser-led autoplay (no MediaRuntime manual control)
 * 
 * Features:
 * - 3:4 aspect ratio (portrait)
 * - Like count overlay
 * - Creator name overlay
 * - Multi-media indicator
 * - Uses canplaythrough for "ready" state (buffered for smooth playback)
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { Heart, Layers } from 'lucide-react';
import { WatchShort } from '@/hooks/useWatchShorts';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { getStreamPoster } from '@/utils/stream';
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
}: WatchShortCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);

  const primaryMedia = video.media[0];
  if (!primaryMedia) return null;

  const mediaUrl = primaryMedia.media_url;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const hasMultipleMedia = video.media.length > 1;

  // CRITICAL: Extract stream UID for cache consistency (matches Clubhouse pattern)
  const streamId = useMemo(() => uidFromNode({ src: mediaUrl }) || video.id, [mediaUrl, video.id]);
  
  // UNIFIED: Generate HLS URL and poster URL exactly like Clubhouse VideoWithAutoplay
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  const generatedPosterUrl = streamId ? generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' }) : undefined;
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : undefined;

  // Reset ready flag when video changes
  React.useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [video.id]);

  // UNIFIED: Use canplaythrough for buffered ready state (matches Clubhouse)
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

  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden cursor-pointer bg-muted",
        "transition-transform duration-100 active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      onClick={onTap}
      tabIndex={0}
      role="button"
      aria-label={`Watch video by ${creator?.display_name || 'Golfer'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
    >
      {/* Poster-first: always show the thumbnail immediately (even when video isn't mounted yet) */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
          }}
        />
      )}

      {/* 
        UNIFIED WITH CLUBHOUSE: HLSPlayer uses same props as VideoWithAutoplay.
        - managedByMediaRuntime={false} for direct browser-led autoplay
        - externallyManaged={false} for HLS.js internal management
        - autoplay based on visibility and mount state
        - preload="auto" for instant buffering
      */}
      {shouldMountVideo && hlsUrl && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}
        >
          <HLSPlayer
            ref={playerRef}
            src={hlsUrl}
            posterUrl={posterUrl}
            muted
            loop
            // UNIFIED: Autoplay when visible (matches Clubhouse pattern)
            autoplay={isVisible}
            showMuteButton={false}
            showPlayButton={false}
            showScrubber={false}
            objectFit="cover"
            className="absolute inset-0 w-full h-full"
            // UNIFIED: Same runtime flags as Clubhouse VideoWithAutoplay
            managedByMediaRuntime={false}
            externallyManaged={false}
            mediaId={streamId}
            // UNIFIED: preload="auto" for instant buffering
            preload="auto"
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
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

export default WatchShortCard;
