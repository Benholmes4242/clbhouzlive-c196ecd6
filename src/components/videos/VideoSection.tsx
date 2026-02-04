/**
 * VideoSection - A modular section for the Videos tab
 * 
 * TikTok-Level: Adaptive prefetch for manifests based on network conditions.
 * Contains title, optional subtitle, video grid, and View All button.
 * Each tile handles its own visibility-based autoplay internally.
 */

import React, { useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { LongFormVideoTileAutoplay, LongFormVideo } from './LongFormVideoTileAutoplay';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';

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
}

/**
 * VideoSection - A modular section for the Videos tab
 * TikTok-Level: Adaptive prefetch for manifests based on network conditions
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
}) => {
  const hasPreloadedRef = useRef<Set<string>>(new Set());
  
  // P0: TikTok-level adaptive prefetch configuration
  const { config: prefetchConfig } = useAdaptivePrefetch();

  // P1: Adaptive manifest preloading based on network conditions
  useLayoutEffect(() => {
    if (videos.length === 0) return;
    
    const { prefetchAhead, preloadManifests } = prefetchConfig;
    if (!preloadManifests) return;
    
    // Preload N manifests based on adaptive config (not just first)
    const toPreload = videos.slice(0, Math.min(prefetchAhead, videos.length));
    
    toPreload.forEach((video) => {
      if (!video.mediaUrl || hasPreloadedRef.current.has(video.id)) return;
      
      const uid = uidFromNode({ media_url: video.mediaUrl });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
        hasPreloadedRef.current.add(video.id);
      }
    });
  }, [videos, prefetchConfig]);

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

      {/* Video cards - full bleed, with index for priority loading */}
      <div className="divide-y divide-border/30">
        {videos.map((video, index) => (
          <LongFormVideoTileAutoplay
            key={video.id}
            video={video}
            onVideoClick={onVideoClick}
            onCreatorClick={onCreatorClick}
            index={index}
          />
        ))}
      </div>

      {/* Section divider */}
      <div className="mt-6 h-2 bg-muted/40" />
    </section>
  );
};

export default VideoSection;
