/**
 * Unified MediaRenderer component for consistent image/video rendering across all feeds.
 * Single source of truth for media display: personal profiles, business profiles, Discover, etc.
 */

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { getStreamPoster } from '@/utils/stream';
import { Play } from 'lucide-react';

export type AspectRatioPreset = '1:1' | '4:5' | '16:9' | 'auto';

interface MediaRendererProps {
  /** Media URL - HLS manifest for video, image URL for images */
  src: string;
  /** Media type */
  type: 'image' | 'video';
  /** Cloudflare Stream ID (if video) - preferred for poster generation */
  streamId?: string | null;
  /** Explicit poster URL (takes precedence over streamId-derived poster) */
  posterUrl?: string | null;
  /** Alt text for images */
  alt?: string;
  /** Aspect ratio preset */
  aspectRatio?: AspectRatioPreset;
  /** Additional className */
  className?: string;
  /** Should video autoplay (muted) */
  autoPlay?: boolean;
  /** Should video loop */
  loop?: boolean;
  /** Show play button overlay on video (for thumbnail mode) */
  showPlayOverlay?: boolean;
  /** onClick handler */
  onClick?: () => void;
  /** CSS filter to apply */
  filter?: string;
}

const aspectRatioClasses: Record<AspectRatioPreset, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '16:9': 'aspect-video',
  'auto': '',
};

export const MediaRenderer = forwardRef<HTMLVideoElement | HTMLImageElement, MediaRendererProps>(
  (
    {
      src,
      type,
      streamId,
      posterUrl,
      alt = '',
      aspectRatio = 'auto',
      className,
      autoPlay = false,
      loop = true,
      showPlayOverlay = false,
      onClick,
      filter,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    // Derive poster URL: explicit > streamId-derived > fallback
    const derivedPoster = posterUrl || (streamId ? getStreamPoster(streamId, '1s') : null) || undefined;

    const containerClasses = cn(
      'relative overflow-hidden bg-muted',
      aspectRatioClasses[aspectRatio],
      onClick && 'cursor-pointer',
      className
    );

    const filterStyle = filter ? { filter } : undefined;

    if (type === 'video') {
      // Video rendering with EnhancedVideoPlayer
      // Note: filter style not supported on EnhancedVideoPlayer - wrap in div if needed
      return (
        <div className={containerClasses} onClick={onClick} style={filterStyle}>
          <EnhancedVideoPlayer
            ref={ref as React.Ref<HTMLVideoElement>}
            src={src}
            poster={derivedPoster}
            autoplay={autoPlay}
            muted={autoPlay}
            loop={loop}
            playsInline
            className="h-full w-full object-cover"
          />
          {showPlayOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="rounded-full bg-black/60 p-3">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // Image rendering
    return (
      <div className={containerClasses} onClick={onClick}>
        {imageError ? (
          <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : (
          <img
            ref={ref as React.Ref<HTMLImageElement>}
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            style={filterStyle}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
      </div>
    );
  }
);

MediaRenderer.displayName = 'MediaRenderer';

export default MediaRenderer;
