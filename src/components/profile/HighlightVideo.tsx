import React, { useRef, useEffect, memo } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { getHlsUrl, attachHlsIfNeeded } from '@/utils/videoPreload';
import { MediaRuntime } from '@/media/runtime';
import type { RegisterMediaFn } from '@/media/useMediaAutoplay';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface HighlightVideoProps {
  highlight: Top100Highlight;
  index: number;
  onEnded: () => void;
  mediaId: string;
  isPlaying: boolean;
  registerMedia: RegisterMediaFn;
  muted: boolean;
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
}: HighlightVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const primaryMedia = highlight.post_media[0];
  
  // Extract Cloudflare Stream ID for crisp thumbnails
  const extractCloudflareStreamId = (m3u8: string) => {
    const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(m3u8);
    return match?.[1] ?? null;
  };

  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const streamId = videoId ? extractCloudflareStreamId(generateStreamHlsUrl(videoId)) : null;
  
  // Use high-res Cloudflare Stream thumbnail for crisp quality
  const posterUrl = streamId 
    ? generateThumbnailUrl(streamId, { width: 640, height: 360, time: 5 })
    : null;

  // Register with MediaRuntime
  useEffect(() => {
    const video = videoRef.current;
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

  // Setup video source
  useEffect(() => {
    let cancelled = false;
    
    if (!videoId || !videoRef.current) return;
    
    const video = videoRef.current;
    video.preload = 'auto';
    video.loop = false; // Ensure no loop
    
    // Pre-attach source once we're near visible
    const setupVideo = async () => {
      try {
        const url = await getHlsUrl(videoId);
        if (!cancelled) {
          await attachHlsIfNeeded(video, url);
        }
      } catch (error) {
        console.warn('Failed to setup video:', error);
      }
    };

    setupVideo();

    // Auto-advance when video ends (mobile behavior controlled by parent)
    const handleEnded = () => onEnded();
    const handleTimeUpdate = () => {
      if (!isFinite(video.duration) || video.duration <= 0) return;
      const pct = video.currentTime / video.duration;
      if (pct >= 0.98) onEnded(); // Robust fallback when 'ended' won't fire
    };
    
    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => { 
      cancelled = true; 
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoId, onEnded]);

  // Sync muted state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
    }
  }, [muted]);

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

  // Track video ready state for poster-first pattern
  const [isVideoReady, setIsVideoReady] = React.useState(false);
  
  // Handle video ready event
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleCanPlay = () => setIsVideoReady(true);
    video.addEventListener('canplay', handleCanPlay);
    
    // If already ready (cached HLS), mark immediately
    if (video.readyState >= 3) {
      setIsVideoReady(true);
    }
    
    return () => video.removeEventListener('canplay', handleCanPlay);
  }, [videoId]);

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
      ) : (
        <>
          {/* Poster image - always visible until video is ready */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt="Video thumbnail"
              className="highlights__video absolute inset-0 w-full h-full object-cover"
              style={{ opacity: isVideoReady ? 0 : 1, transition: 'opacity 150ms ease-out' }}
            />
          )}
          <video 
            ref={videoRef}
            className="highlights__video"
            style={{ opacity: isVideoReady ? 1 : 0, transition: 'opacity 150ms ease-out' }}
            muted={muted}
            playsInline
            preload="auto"
            poster={posterUrl || undefined}
          />
        </>
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
