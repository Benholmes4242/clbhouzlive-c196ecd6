import React, { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { LongFormVideoTileAutoplay, LongFormVideo } from './LongFormVideoTileAutoplay';
import type { RegisterMediaFn } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface VideoSectionProps {
  title: string;
  subtitle?: string;
  videos: LongFormVideo[];
  onViewAll?: () => void;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  showViewAll?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  // Autoplay integration - supports both old and new systems
  registerVideo?: RegisterMediaFn;
  playingIds?: Set<string>;
  startIndex?: number; // Starting index for sortIndex calculation
}

/**
 * VideoSection - A modular section for the Videos tab
 * Contains title, optional subtitle, video grid, and View All button
 * Supports grid autoplay with registerVideo and playingIds
 */
export const VideoSection: React.FC<VideoSectionProps> = ({
  title,
  subtitle,
  videos,
  onViewAll,
  onVideoClick,
  onCreatorClick,
  showViewAll = true,
  emptyState,
  className,
  registerVideo,
  playingIds,
  startIndex = 0,
}) => {
  const hasPreloadedFirst = useRef(false);

  // Eager preload first video's HLS manifest on mount
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || videos.length === 0) return;
    
    const firstVideo = videos[0];
    const mediaUrl = firstVideo.mediaUrl;
    if (!mediaUrl) return;
    
    const uid = uidFromNode({ media_url: mediaUrl });
    if (uid) {
      preloadHlsManifest(generateStreamHlsUrl(uid));
      hasPreloadedFirst.current = true;
    }
  }, [videos]);
  if (videos.length === 0 && emptyState) {
    return (
      <section className={cn("px-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {emptyState}
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className={cn("", className)}>
      {/* Header with View All */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium text-foreground">View all</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Video cards with consistent spacing */}
      <div className="px-4 space-y-4">
        {videos.map((video, index) => (
          <LongFormVideoTileAutoplay
            key={video.id}
            video={video}
            onVideoClick={onVideoClick}
            onCreatorClick={onCreatorClick}
            registerVideo={registerVideo}
            isPlaying={playingIds?.has(video.id) ?? false}
            videoIndex={startIndex + index}
          />
        ))}
      </div>

      {/* Section divider */}
      <div className="mt-6 h-2 bg-muted/40" />
    </section>
  );
};

export default VideoSection;
