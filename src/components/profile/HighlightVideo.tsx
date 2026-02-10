import React, { useRef, memo, useState, useCallback, useId } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import UnifiedVideoPlayer from '@/media/components/UnifiedVideoPlayer';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';

interface HighlightVideoProps {
  highlight: Top100Highlight;
  index: number;
  onEnded: () => void;
  isActive: boolean;
  muted: boolean;
  onTap?: () => void;
  durationSeconds?: number;
}

/** Video element using UnifiedVideoPlayer with MediaRuntime coordination */
const HighlightVideo = memo(function HighlightVideo({
  highlight,
  index,
  onEnded,
  isActive,
  muted,
  onTap,
  durationSeconds,
}: HighlightVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const primaryMedia = highlight.post_media[0];
  
  // Extract Cloudflare Stream ID
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const hlsUrl = videoId ? generateStreamHlsUrl(videoId) : null;
  const posterUrl = videoId 
    ? generateThumbnailUrl(videoId, { width: 640, height: 360, time: 5 })
    : null;

  const studioEdits = (primaryMedia as any)?.studio_edits;

  const handlePlay = useCallback(() => setIsVideoPlaying(true), []);
  const handleError = useCallback(() => setHasError(true), []);

  // Format duration for badge
  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!primaryMedia) {
    return (
      <div ref={containerRef} className="highlights__card">
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="highlights__card relative" onClick={onTap}>
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
          {/* Shimmer base layer */}
          {!posterLoaded && !isVideoPlaying && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Poster with fade-in */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt="Video thumbnail"
              className="highlights__video absolute inset-0 w-full h-full object-cover"
              style={{ 
                opacity: isVideoPlaying ? 0 : posterLoaded ? 1 : 0, 
                transition: 'opacity 200ms ease-out' 
              }}
              onLoad={() => setPosterLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.onerror = null;
              }}
            />
          )}

          {/* UnifiedVideoPlayer - only mounted for active + adjacent slides */}
          {isActive && hlsUrl && !hasError && (
            <div style={{ opacity: isVideoPlaying ? 1 : 0, transition: 'opacity 150ms ease-out' }}>
              <UnifiedVideoPlayer
                src={hlsUrl}
                posterUrl={posterUrl || undefined}
                muted={muted}
                autoplay={isActive}
                loop={false}
                className="highlights__video"
                objectFit="cover"
                surface="highlights"
                managedByMediaRuntime={true}
                onPlay={handlePlay}
                onEnded={onEnded}
                onError={handleError}
              />
            </div>
          )}

          {/* Duration badge */}
          {durationSeconds && durationSeconds > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
              {formatDur(durationSeconds)}
            </div>
          )}
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
