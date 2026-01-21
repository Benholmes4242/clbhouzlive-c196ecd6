/**
 * WatchShortCard - Individual video card for Watch grid
 * 
 * PAUSED-VIDEO-FIRST ARCHITECTURE:
 * - HLSPlayer is ALWAYS mounted (not conditionally)
 * - Shows paused first frame when not playing (NOT a poster image)
 * - Skeleton shown only before canplaythrough
 * - No visual swap between poster and video
 * 
 * MEDIARUNTIME INTEGRATION (Jan 2026):
 * - All playback is routed through MediaRuntime via useWatchRuntimeBridge
 * - Video element refs are passed to parent for registration
 * - Generation tracking prevents stale play attempts
 * - Coordinated playback (single video at a time)
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

interface WatchShortCardProps {
  video: WatchShort;
  index: number;
  onTap: () => void;
  isAutoplayCandidate: boolean;
  /** Whether video should be mounted (controlled by parent grid) */
  shouldMountVideo?: boolean;
  /** Whether card is visible in viewport */
  isVisible?: boolean;
  /** Whether video is ready (buffered) - from ready queue */
  isVideoReady?: boolean;
  /** Callback when video is buffered enough to play smoothly (for prefetch system) */
  onFirstFrameReady?: () => void;
  /** Callback to register video element ref with parent for MediaRuntime */
  onVideoRef?: (videoId: string, el: HTMLVideoElement | null) => void;
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
  isAutoplayCandidate,
  shouldMountVideo = false,
  isVisible = false,
  isVideoReady = false,
  onFirstFrameReady,
  onVideoRef,
}: WatchShortCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  const hasReportedVideoRef = useRef(false);

  const primaryMedia = video.media[0];
  if (!primaryMedia) return null;

  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;
  const likeCount = video.like_count || 0;
  const hasMultipleMedia = video.media.length > 1;

  // CRITICAL: Extract stream UID for cache consistency
  const streamId = useMemo(() => uidFromNode({ src: mediaUrl }) || video.id, [mediaUrl, video.id]);

  // Note: Autoplay is now fully controlled by MediaRuntime via useWatchRuntimeBridge
  // We pass autoplay={false} and managedByMediaRuntime={true} to HLSPlayer
  // The shouldMountVideo, isVisible, and isAutoplayCandidate props are used by the parent
  // grid to determine which videos to register with MediaRuntime

  // Reset ready flag when video changes
  React.useEffect(() => {
    hasReportedReadyRef.current = false;
    hasReportedVideoRef.current = false;
  }, [video.id]);

  // Called when video is buffered enough to play smoothly
  // This is the TRUE "ready" state for the prefetch system
  // CRITICAL: Use stream UID, not video.id
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onFirstFrameReady?.();
    }
    
    // Report video element to parent for MediaRuntime registration
    if (!hasReportedVideoRef.current && playerRef.current) {
      const videoEl = playerRef.current.getElement();
      if (videoEl) {
        hasReportedVideoRef.current = true;
        onVideoRef?.(video.id, videoEl);
      }
    }
  }, [streamId, onFirstFrameReady, onVideoRef, video.id]);

  const handleError = useCallback(() => {
    // Still report as "ready" so scroll isn't blocked
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);
  
  // Cleanup video ref on unmount
  React.useEffect(() => {
    return () => {
      if (hasReportedVideoRef.current) {
        onVideoRef?.(video.id, null);
      }
    };
  }, [video.id, onVideoRef]);

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
        PAUSED-VIDEO-FIRST: HLSPlayer is mounted when shouldMountVideo is true.
        We fade the player in only once it's "ready" (canplaythrough) to avoid showing
        a loading spinner/blank state during fast scroll.
      */}
      {shouldMountVideo && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}
        >
          <HLSPlayer
            ref={playerRef}
            src={mediaUrl}
            posterUrl={posterUrl}
            autoplay={false}
            muted
            loop
            objectFit="cover"
            className="absolute inset-0 w-full h-full"
            onCanPlayThrough={handleCanPlayThrough}
            onError={handleError}
            mediaId={uidFromNode({ src: mediaUrl }) || video.id}
            managedByMediaRuntime={true}
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
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate &&
    prevProps.shouldMountVideo === nextProps.shouldMountVideo &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

export default WatchShortCard;
