import React, { useCallback, useRef, useEffect, useState, useId } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { MapPin, Play, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { useVideoVisibility } from '@/hooks/useVideoVisibility';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import CoursePostBadge from '@/components/posts/CoursePostBadge';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';


interface HighlightCardWithModalProps {
  highlight: Top100Highlight;
  onOpenModal?: (postId: string) => void;
  isLandscape?: boolean;
  cardIndex?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

const HighlightCardWithModal: React.FC<HighlightCardWithModalProps> = ({ 
  highlight, 
  onOpenModal,
  isLandscape = false,
  cardIndex = 0,
  scrollContainerRef
}) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const playerRef = useRef<HLSPlayerRef>(null);
  
  // State for audio preference (muted by default for grid autoplay)
  const [isMuted, setIsMuted] = useState(true);
  
  
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
  
  const hlsUrl = videoId ? generateStreamHlsUrl(videoId) : null;

  // Use grid-style video visibility for autoplay
  const { containerRef, isVisible, isNear } = useVideoVisibility({
    threshold: 0.6,
    rootMargin: '0px 50px',
    videoRef: { current: playerRef.current?.getElement() ?? null } as React.RefObject<HTMLVideoElement>,
    shouldAutoplay: true,
    globallyMuted: isMuted
  });

  // Generate stable media ID
  const mediaId = useId();

  // Handle play/pause click via MediaRuntime
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryMedia?.media_type === 'video') {
      const el = playerRef.current?.getElement();
      if (el?.paused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'fullscreen', reason: 'user' });
      } else {
        MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
      }
    }
  }, [primaryMedia, mediaId]);

  // Handle mute/unmute toggle
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  }, [isMuted]);


  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="flex-none w-80 bg-card overflow-hidden shadow-sm">
        <div className="relative h-48 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{highlight.golf_course.name}</h4>
            </div>
          </div>
          {highlight.content && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {highlight.content}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            {format(createdDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="group/highlight bg-card overflow-hidden shadow-sm cursor-pointer card-base card-highlights">
      <div className="relative overflow-hidden card-base card-highlights" onClick={handleVideoClick}>
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            {/* Grid-style video with visibility-based autoplay */}
            <HLSPlayer
              ref={playerRef}
              src={hlsUrl || ''}
              autoplay={isVisible}
              muted={isMuted}
              loop
              showMuteButton={false}
              showPlayButton={false}
              objectFit="cover"
              mediaId={uidFromNode({ src: hlsUrl }) || highlight.id}
              className="w-full h-full"
            />
          </>
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

        {/* Top Right Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {/* Media count indicator */}
          {highlight.post_media.length > 1 && (
            <div className="bg-black/50 text-white px-2 py-1 rounded-md text-xs">
              +{highlight.post_media.length - 1} more
            </div>
          )}

        {/* Mute/Unmute Button for videos */}
        {primaryMedia.media_type === 'video' && (
          <button
            onClick={handleMuteToggle}
            className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 shadow-lg w-7 h-7 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}
        </div>
      </div>
    </div>
  );
};

export default HighlightCardWithModal;