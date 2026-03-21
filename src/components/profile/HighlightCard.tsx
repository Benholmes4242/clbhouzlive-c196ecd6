import React, { useRef, useEffect } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { Volume2, VolumeX } from 'lucide-react';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { useHlsUrlCache } from '@/hooks/useHlsUrlCache';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface HighlightCardProps {
  highlight: Top100Highlight;
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight, muted, setMuted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { getHlsUrl } = useHlsUrlCache();
  
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

  // Setup video with HLS when component mounts
  useEffect(() => {
    let cancelled = false;
    let hls: any = null;

    if (videoId && videoRef.current) {
      const setupVideo = async () => {
        try {
          const hlsUrl = await getHlsUrl(videoId);
          if (cancelled) return;
          
          const video = videoRef.current!;
          video.preload = 'auto';
          
          // Check if browser supports native HLS
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
          } else {
            // Use HLS.js for browsers without native support
            const { default: Hls } = await import('hls.js');
            if (Hls.isSupported() && !cancelled) {
              hls = new Hls({
                autoStartLoad: true,
                startLevel: -1,
                capLevelToPlayerSize: false,
                abrEwmaDefaultEstimate: 5_000_000 > 0 ? 5_000_000 : 8_000_000,
              });
              hls.attachMedia(video);
              hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(hlsUrl);
              });
            }
          }
        } catch (error) {
          // Silently handle errors for preload
        }
      };

      setupVideo();
    }

    return () => {
      cancelled = true;
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoId, getHlsUrl]);

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="highlights__card">
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
        
        {/* Golf Course Badge */}
        {highlight.golf_course && (
          <div className="absolute top-3 left-3 z-20">
            <CoursePostBadge 
              course={{
                id: highlight.golf_course.id,
                name: highlight.golf_course.name,
                country: highlight.golf_course.country
              }}
              className="text-xs"
            />
          </div>
        )}
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
          muted={muted}
          playsInline
          loop
          preload="auto"
        />
      )}
      
      {/* Golf Course Badge - Top Left */}
      {highlight.golf_course && (
        <div className="absolute top-3 left-3 z-20">
          <CoursePostBadge 
            course={{
              id: highlight.golf_course.id,
              name: highlight.golf_course.name,
              country: highlight.golf_course.country
            }}
            className="text-xs"
          />
        </div>
      )}

      {/* Unmute Button - Top Right */}
      {primaryMedia.media_type === 'video' && (
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-3 right-3 z-30 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg w-8 h-8 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export default HighlightCard;