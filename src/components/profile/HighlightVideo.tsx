import { useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import type { RegisterMediaFn } from '@/media/useMediaAutoplay';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';

interface HighlightVideoProps {
  highlight: Top100Highlight;
  index: number;
  onEnded: () => void;
  mediaId: string;
  isPlaying: boolean;
  registerMedia: RegisterMediaFn;
  muted: boolean;
  /** Whether video is ready (buffered) - from parent ready queue */
  isVideoReady?: boolean;
  /** Callback when video is buffered enough to play smoothly */
  onReady?: (id: string) => void;
}

/** Video element that uses MediaRuntime for playback control */
const HighlightVideo = memo(function HighlightVideo({
  highlight,
  index,
  onEnded,
  mediaId,
  isPlaying,
  registerMedia,
  muted,
  isVideoReady = true, // Default true for backward compat
  onReady,
}: HighlightVideoProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  
  const primaryMedia = highlight.post_media[0];
  
  // Extract Cloudflare Stream ID for crisp thumbnails
  const extractCloudflareStreamId = (m3u8: string) => {
    const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(m3u8);
    return match?.[1] ?? null;
  };

  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const hlsUrl = videoId ? generateStreamHlsUrl(videoId) : null;
  const streamId = hlsUrl ? extractCloudflareStreamId(hlsUrl) : null;
  
  // Use high-res Cloudflare Stream thumbnail for crisp quality
  const posterUrl = streamId 
    ? generateThumbnailUrl(streamId, { width: 640, height: 360, time: 5 })
    : null;

  // CRITICAL: Extract stream UID for cache consistency
  const cacheStreamId = useMemo(() => {
    if (!hlsUrl) return highlight.id;
    return uidFromNode({ src: hlsUrl }) || highlight.id;
  }, [hlsUrl, highlight.id]);

  // Reset ready flag when highlight changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [highlight.id]);

  // Handle video ready (buffered for smooth playback)
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && primaryMedia?.media_type === 'video') {
      hasReportedReadyRef.current = true;
      console.log(`[HighlightVideo] Video ${cacheStreamId.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(cacheStreamId);
    }
  }, [cacheStreamId, primaryMedia?.media_type, onReady]);

  // Register with MediaRuntime
  useEffect(() => {
    const getVideoElement = () => playerRef.current?.getElement();
    const video = getVideoElement();
    if (!video || primaryMedia?.media_type !== 'video') return;

    registerMedia({
      id: mediaId,
      element: video,
      isCandidate: true,
      sortIndex: index,
      observeTarget: containerRef.current,
    });

    return () => {
      registerMedia({ id: mediaId, element: null });
    };
  }, [mediaId, index, registerMedia, primaryMedia?.media_type]);

  // Handle video ended
  useEffect(() => {
    const video = playerRef.current?.getElement();
    if (!video) return;

    const handleEnded = () => onEnded();
    const handleTimeUpdate = () => {
      if (!isFinite(video.duration) || video.duration <= 0) return;
      const pct = video.currentTime / video.duration;
      if (pct >= 0.98) onEnded();
    };
    
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => { 
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onEnded]);

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div ref={containerRef} className="highlights__card">
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
      </div>
    );
  }

  // Get studio_edits from primaryMedia
  const studioEdits = (primaryMedia as any)?.studio_edits;

  return (
    <div ref={containerRef} className="highlights__card relative">
      {primaryMedia.media_type === 'image' ? (
        <img
          src={primaryMedia.media_url}
          alt="Golf course moment"
          className="highlights__video"
          loading="lazy"
          decoding="async"
        />
      ) : hlsUrl ? (
        <>
          {/* HLSPlayer - opacity controlled by isVideoReady */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isVideoReady ? "opacity-100" : "opacity-0"
          )}>
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl}
              autoplay={isPlaying}
              muted={muted}
              loop={false}
              showMuteButton={false}
              showPlayButton={false}
              objectFit="cover"
              mediaId={cacheStreamId}
              className="highlights__video"
              onCanPlayThrough={handleCanPlayThrough}
              managedByMediaRuntime={true}
            />
          </div>
          
          {/* Static thumbnail when not ready - NO SPINNER */}
          {!isVideoReady && posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className="highlights__video"
            />
          )}
        </>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      )}
      
      {/* Text overlays from studio_edits */}
      {studioEdits?.textOverlays?.length > 0 && (
        <TextOverlayRenderer
          textOverlays={studioEdits.textOverlays}
          isEditable={false}
        />
      )}
    </div>
  );
});

export default HighlightVideo;
