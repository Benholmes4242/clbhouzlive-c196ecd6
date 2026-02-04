/**
 * VideosGrid - Video grid for Discover tab
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Adaptive prefetch (3-20 range) based on network/battery/scroll speed
 * - Scroll velocity tracking with EWMA smoothing
 * - Memory pressure awareness via useLazyTiles
 * - Shimmer-down skeleton animations with staggered delays
 * - Reduced motion support
 * - Preload hint scheduling via preloadHlsManifest
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import VideoExploreCard from './VideoExploreCard';
import ShortCardWithObserver from '@/components/shorts/ShortCardWithObserver';
import { ExploreContentItem } from '@/components/explore/types';
import { InterleavedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from './ChannelSuggestionCard';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import ShortsInlineBlock from './ShortsInlineBlock';
import ShortsViewer from '@/components/shorts/ShortsViewer';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { Skeleton } from '@/components/ui/skeleton';
import {
  logGridMount,
  logVideosArrayUpdate,
  logLazyTilesState,
  logRenderedCards,
} from '@/utils/debugWatchPage';

interface VideosGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isShorts?: boolean;
  activeTab?: string;
  interleavedFeed?: InterleavedItem[] | null;
}

// P3: Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

const VideosGrid: React.FC<VideosGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  isShorts = false,
  activeTab = 'all',
  interleavedFeed = null
}) => {
  // Debug: Log component mount
  useEffect(() => {
    logGridMount();
  }, []);

  // State for ShortsViewer
  const [shortsViewerOpen, setShortsViewerOpen] = useState(false);
  const [shortsViewerItems, setShortsViewerItems] = useState<ExploreContentItem[]>([]);
  const [shortsViewerIndex, setShortsViewerIndex] = useState(0);

  const handleShortClick = (short: ExploreContentItem, allShorts: ExploreContentItem[], index: number) => {
    setShortsViewerItems(allShorts);
    setShortsViewerIndex(index);
    setShortsViewerOpen(true);
  };

  // Use interleaved feed if provided, otherwise filter videos
  const itemsToRender = useMemo(() => {
    return interleavedFeed 
      ? interleavedFeed 
      : content.filter(item => item.type === 'video').map(video => ({
          kind: 'video' as const,
          id: video.id,
          data: video
        }));
  }, [interleavedFeed, content]);

  // Debug: Log videos array updates
  useEffect(() => {
    logVideosArrayUpdate(itemsToRender, 'VideosGrid.itemsToRender');
    logRenderedCards();
  }, [itemsToRender.length]);
  
  // P1: Adaptive prefetch with scroll velocity tracking
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  
  // Lazy loading - only mount items near viewport
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: itemsToRender.length,
    initialVisible: 12,
    preloadViewports: 2,
    estimatedRowHeight: 300,
  });

  // Debug: Log lazy tiles state
  useEffect(() => {
    logLazyTilesState({
      initialVisible: 12,
      totalItems: itemsToRender.length,
      visibleCount: visibleIndices.size,
      visibleIndices: Array.from(visibleIndices),
    });
  }, [visibleIndices, itemsToRender.length]);

  // Create video URL map for prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<number, string>();
    itemsToRender.forEach((item, index) => {
      if (item.kind === 'video' && item.data) {
        const videoData = item.data as ExploreContentItem;
        const streamId = uidFromNode({ src: videoData.src });
        if (streamId) {
          map.set(index, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [itemsToRender]);

  const videoUrlMapRef = useRef(videoUrlMap);
  videoUrlMapRef.current = videoUrlMap;

  // P1: Preload hint scheduling for upcoming videos
  const schedulePrefetch = useCallback((currentIndex: number) => {
    const { prefetchAhead } = prefetchConfig;
    const urlMap = videoUrlMapRef.current;
    
    for (let i = 1; i <= prefetchAhead && currentIndex + i < itemsToRender.length; i++) {
      const url = urlMap.get(currentIndex + i);
      if (url) {
        preloadHlsManifest(url);
      }
    }
  }, [prefetchConfig, itemsToRender.length]);

  // Refs to avoid stale closure in IntersectionObserver callback
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const gridRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with props - this avoids stale closures
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Track visible index for prefetch scheduling
  const handleVisibilityChange = useCallback((index: number, isVisible: boolean) => {
    if (isVisible) {
      // P1: Scroll velocity tracking
      onIndexChange();
      // P1: Schedule manifest prefetch for upcoming videos
      schedulePrefetch(index);
    }
  }, [onIndexChange, schedulePrefetch]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (itemsToRender.length === 0 || !hasMore || !onLoadMore) {
      return;
    }
    
    let observer: IntersectionObserver | null = null;
    let sentinel: HTMLDivElement | null = null;
    
    const timeoutId = setTimeout(() => {
      const gridContainer = gridRef.current;
      if (!gridContainer) return;
      
      sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';
      sentinel.dataset.infiniteScrollSentinel = 'true';
      gridContainer.appendChild(sentinel);
      
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current && !isFetchingRef.current) {
            loadingRef.current = true;
            onLoadMoreRef.current?.();
            setTimeout(() => {
              loadingRef.current = false;
            }, 1000);
          }
        },
        {
          rootMargin: '800px',
          threshold: 0
        }
      );
      
      observer.observe(sentinel);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      observer?.disconnect();
      sentinel?.remove();
    };
  }, [itemsToRender.length, hasMore, onLoadMore]);

  if (itemsToRender.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-3">🎥</div>
        <h3 className="text-base font-semibold text-foreground mb-0.5">No videos found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No videos match these filters. Try a different duration or topic.
        </p>
      </div>
    );
  }

  // Cinematic mode for all video duration tabs
  const isCinematicMode = true;

  // P2: Shimmer-down skeleton with staggered delays
  if (isLoading && itemsToRender.length === 0) {
    return (
      <div className="flex flex-col gap-3 pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i}
            className={`w-full aspect-video rounded-lg ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
            style={prefersReducedMotion ? undefined : { animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {isCinematicMode ? (
        // Landscape cards layout - full width edge to edge with lazy loading
        <div ref={gridRef} className="flex flex-col gap-3 pb-4">
          {itemsToRender.map((item, index) => {
            const isPriority = index < 6; // First 6 cards get priority loading
            
            // Channel suggestions and shorts blocks always render (non-video content)
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="w-full mt-[10px] mb-[30px]"
                />
              );
            }
            
            if (item.kind === 'shorts_block' && Array.isArray(item.data)) {
              return (
                <ShortsInlineBlock
                  key={item.id}
                  shorts={item.data}
                  blockId={item.id}
                  onShortClick={(short, idx) => handleShortClick(short, item.data as ExploreContentItem[], idx)}
                />
              );
            }
            
            // Video items use lazy loading
            return (
              <div
                key={`${activeTab}-${item.id}`}
                ref={(el) => {
                  registerTile(index, el);
                  // Track visibility for prefetch scheduling
                  if (el && visibleIndices.has(index)) {
                    handleVisibilityChange(index, true);
                  }
                }}
                data-lazy-index={index}
              >
                {visibleIndices.has(index) ? (
                  <ShortCardWithObserver
                    item={item.data as ExploreContentItem}
                    onClick={() => onMediaClick?.(item.data as ExploreContentItem)}
                    variant="landscape"
                    gridPosition={index}
                    isPriority={isPriority}
                  />
                ) : (
                  // P2: Shimmer-down skeleton placeholder
                  <Skeleton 
                    className={`w-full aspect-video rounded-lg ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
                    style={prefersReducedMotion ? undefined : { animationDelay: `${(index % 6) * 50}ms` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Original grid layout for other tabs with lazy loading
        <div className="grid grid-cols-2 md:grid-cols-3" style={{ rowGap: '18px', columnGap: '2px' }}>
          {itemsToRender.map((item, index) => {
            const isPriority = index < 6;
            
            if (item.kind === 'channel_suggestion') {
              return (
                <ChannelSuggestionCard
                  key={item.id}
                  suggestion={item.data as ChannelSuggestion}
                  className="col-span-2 md:col-span-3 my-[30px]"
                />
              );
            }
            
            if (item.kind === 'shorts_block' && Array.isArray(item.data)) {
              return (
                <div key={item.id} className="col-span-2 md:col-span-3">
                  <ShortsInlineBlock
                    shorts={item.data}
                    blockId={item.id}
                    onShortClick={(short, idx) => handleShortClick(short, item.data as ExploreContentItem[], idx)}
                  />
                </div>
              );
            }
            
            return (
              <div
                key={`${activeTab}-${item.id}`}
                ref={(el) => registerTile(index, el)}
                data-lazy-index={index}
              >
                {visibleIndices.has(index) ? (
                  <VideoExploreCard
                    item={item.data as ExploreContentItem}
                    onMediaClick={onMediaClick}
                    compact={isShorts}
                    isPriority={isPriority}
                  />
                ) : (
                  <Skeleton 
                    className={`aspect-[9/16] rounded-lg ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
                    style={prefersReducedMotion ? undefined : { animationDelay: `${(index % 6) * 50}ms` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* All caught up message */}
      {!hasMore && itemsToRender.length > 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}

      {/* ShortsViewer */}
      {shortsViewerOpen && (
        <ShortsViewer
          items={shortsViewerItems}
          initialIndex={shortsViewerIndex}
          isOpen={shortsViewerOpen}
          onClose={() => setShortsViewerOpen(false)}
        />
      )}
    </>
  );
};

export default VideosGrid;
