import React, { useRef, useEffect, memo } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { getHlsUrl, attachHlsIfNeeded } from '@/utils/videoPreload';

interface HighlightVideoProps {
  highlight: Top100Highlight;
  index: number;
  onEnded: () => void;
}

/** Video element that never re-renders due to mute changes */
const HighlightVideo = memo(function HighlightVideo({
  highlight,
  index,
  onEnded,
}: HighlightVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const primaryMedia = highlight.post_media[0];
  
  // Extract Cloudflare Stream ID for crisp thumbnails
  const extractCloudflareStreamId = (m3u8: string) => {
    const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(m3u8);
    return match?.[1] ?? null;
  };

  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const streamId = videoId ? extractCloudflareStreamId(`https://videodelivery.net/${videoId}/manifest/video.m3u8`) : null;
  
  // Use high-res Cloudflare Stream thumbnail for crisp quality
  const posterUrl = streamId 
    ? generateThumbnailUrl(streamId, { width: 640, height: 360, time: 5 })
    : null;

  useEffect(() => {
    let cancelled = false;
    
    if (!videoId || !videoRef.current) return;
    
    const video = videoRef.current;
    video.preload = 'auto';
    
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
    video.addEventListener('ended', handleEnded);
    
    return () => { 
      cancelled = true; 
      video.removeEventListener('ended', handleEnded); 
    };
  }, [videoId, onEnded]);

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="highlights__card">
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
      </div>
    );
  }

  return (
    <div className="highlights__card">
      {primaryMedia.media_type === 'image' ? (
        <img
          src={primaryMedia.media_url}
          alt="Golf course moment"
          className="highlights__video"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <video 
          ref={videoRef}
          className="highlights__video"
          poster={posterUrl || undefined}
          muted
          playsInline
          loop
          preload="auto"
        />
      )}
    </div>
  );
});

export default HighlightVideo;