import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { Volume2, VolumeX } from 'lucide-react';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { cn } from '@/lib/utils';

interface HighlightCardProps {
  highlight: Top100Highlight;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  /** Whether video is ready (buffered) - from parent ready queue */
  isVideoReady?: boolean;
  /** Callback when video is buffered enough to play smoothly */
  onReady?: (id: string) => void;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ 
  highlight, 
  muted, 
  setMuted,
  isVideoReady = true, // Default true for backward compat
  onReady,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
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
      console.log(`[HighlightCard] Video ${cacheStreamId.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(cacheStreamId);
    }
  }, [cacheStreamId, primaryMedia?.media_type, onReady]);

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
              autoplay={false}
              muted={muted}
              loop
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
        <div className="w-full h-full bg-muted" />
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