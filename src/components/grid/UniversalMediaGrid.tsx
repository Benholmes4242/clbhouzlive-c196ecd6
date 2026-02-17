/**
 * UniversalMediaGrid - One True Grid™
 * 
 * Single unified grid component that handles ALL media grid use cases:
 * - Vertical feed (Clubhouse)
 * - Portrait grid (Watch, Profile Activity)
 * - Mixed grid (Explore)
 * - Hero + grid (Trending)
 * 
 * Configuration-based approach replaces 4+ separate grid implementations.
 */

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  UniversalMediaGridProps,
  UniversalMediaItem,
  UniversalGridConfig,
  DEFAULT_CONFIGS,
  GRID_GAP_PX,
} from './types';
import { 
  PortraitGridLayout,
  VerticalFeedLayout,
  VerticalFeedItem,
  HeroGridLayout,
  MixedGridLayout,
} from './layouts';
import { 
  useAutoplayPattern,
  markAutoplayCandidates,
  useViewportTracking,
  useGridMediaRuntime,
} from './hooks';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import MediaTile from './MediaTile';
import HeroTile from './HeroTile';
import { TilePlaceholder } from './TilePlaceholder';
import {
  logObserverSetup,
  logObserverCallback,
  logObserverDisconnect,
} from '@/utils/debugWatchPage';

// Debug logging
const DEBUG = false;
const log = (msg: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`[UniversalMediaGrid] ${msg}`, data ?? '');
};

/**
 * UniversalMediaGrid - The One True Grid
 */
export function UniversalMediaGrid({
  items,
  config,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  onLike,
  onAuthorClick,
  currentUserId,
  isOwnProfile = false,
  onEditPost,
  onDeletePost,
  heroItem,
  onHeroClick,
  onCurrentIndexChange,
  onScrollStateChange,
  chromeState,
}: UniversalMediaGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  
  // Merge with default config for surface
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIGS[config.surface],
    ...config,
  }), [config]);

  // Video ready queue for prefetching
  const prefetchConfig = useMemo(() => {
    const columns = mergedConfig.columns ?? 2;
    const rowsVisible = 6;
    const itemsPerPage = columns * rowsVisible;
    return {
      ahead: itemsPerPage * 2,  // 2 pages ahead
      behind: itemsPerPage,     // 1 page behind
    };
  }, [mergedConfig.columns]);

  const {
    isReady,
    markReady,
    initiatePrefetch,
  } = useVideoReadyQueue({
    prefetchAhead: prefetchConfig.ahead,
    prefetchBehind: prefetchConfig.behind,
    readyTimeout: 10000,
  });

  // CRITICAL: Extract video IDs using stream UIDs for cache consistency
  const videoIds = useMemo(() => 
    items.filter(item => item.type === 'video').map(item => {
      // Use playbackUrl (HLS URL) or fall back to url for UID extraction
      const mediaUrl = item.playbackUrl || item.url;
      const streamId = uidFromNode({ src: mediaUrl });
      return streamId || item.id;
    }),
    [items]
  );

  // Create video URL map for prefetch
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    items.filter(item => item.type === 'video').forEach(item => {
      const mediaUrl = item.playbackUrl || item.url;
      const streamId = uidFromNode({ src: mediaUrl });
      if (streamId) {
        map.set(streamId, generateStreamHlsUrl(streamId));
      }
    });
    return map;
  }, [items]);

  // Initialize prefetch on mount
  useEffect(() => {
    if (videoIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoIds, 0, videoUrlMap);
    }
  }, [videoIds, videoUrlMap, initiatePrefetch]);
  
  // Mark autoplay candidates based on pattern
  const processedItems = useMemo(() => {
    return markAutoplayCandidates(
      items,
      mergedConfig.autoplayPattern,
      mergedConfig.autoplayNth ?? 3,
      0 // hero index
    ) as UniversalMediaItem[];
  }, [items, mergedConfig.autoplayPattern, mergedConfig.autoplayNth]);
  
  // Viewport tracking for lazy loading
  // For portrait-grid (Watch page), render all items initially to avoid blank tiles
  // The IntersectionObserver-based approach has issues with placeholder visibility
  const skipVirtualization = mergedConfig.layout === 'portrait-grid' || mergedConfig.layout === 'mixed-grid';
  
  const { visibleIndices, registerTile, shouldRender: viewportShouldRender } = useViewportTracking({
    totalItems: processedItems.length,
    initialVisible: skipVirtualization ? processedItems.length : (mergedConfig.initialVisible ?? 6),
    preloadViewports: mergedConfig.preloadViewports ?? 2,
    estimatedRowHeight: mergedConfig.layout === 'portrait-grid' ? 250 : 200,
    keepMounted: true,
  });
  
  // For grids without virtualization, always render all items
  const shouldRender = useCallback((index: number): boolean => {
    return skipVirtualization ? true : viewportShouldRender(index);
  }, [skipVirtualization, viewportShouldRender]);
  
  // MediaRuntime integration
  const { registerMedia, playingIds, setScrolling } = useGridMediaRuntime({
    surface: mergedConfig.surface,
    maxConcurrent: mergedConfig.maxConcurrent,
    playThreshold: mergedConfig.playThreshold ?? 0.4,
    pauseThreshold: mergedConfig.pauseThreshold ?? 0.25,
    enabled: mergedConfig.autoplayPattern !== 'none',
  });
  
  // Keep refs in sync with latest prop values
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
  }, [hasMore, isLoading]);

  // Infinite scroll handler (IntersectionObserver sentinel; works with nested scroll containers)
  // Re-observe when items.length changes to recalculate sentinel position after content loads
  useEffect(() => {
    if (!mergedConfig.infiniteScroll || !onLoadMore) return;

    const sentinel = sentinelRef.current;
    
    // Debug: Log observer setup
    const ROOT_MARGIN = '400px 0px';
    
    logObserverSetup({
      rootMargin: ROOT_MARGIN,
      threshold: 0,
      hasSentinel: !!sentinel,
      sentinelRect: sentinel?.getBoundingClientRect(),
    });
    
    console.log('🟠 [Scroll] OBSERVER_RE-SETUP', { itemCount: items.length });
    
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        const willTrigger = first?.isIntersecting && hasMoreRef.current && !loadingRef.current && !isLoadingRef.current;
        
        // Debug: Log observer callback
        logObserverCallback({
          isIntersecting: first?.isIntersecting ?? false,
          intersectionRatio: first?.intersectionRatio ?? 0,
          boundingClientRect: first?.boundingClientRect ?? new DOMRect(),
          hasMore: hasMoreRef.current,
          isLoading: loadingRef.current || isLoadingRef.current,
          willTrigger,
        });
        
        if (!first?.isIntersecting) return;
        
        // Use refs for latest values - avoids stale closure problem
        if (!hasMoreRef.current || loadingRef.current || isLoadingRef.current) {
          return;
        }

        loadingRef.current = true;
        onLoadMore();
        window.setTimeout(() => {
          loadingRef.current = false;
        }, 500);
      },
      {
        root: null,
        rootMargin: ROOT_MARGIN,
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => {
      logObserverDisconnect();
      observer.disconnect();
    };
  }, [mergedConfig.infiniteScroll, onLoadMore, items.length]); // Re-observe when content changes
  
  // Handle item click
  const handleItemClick = useCallback((item: UniversalMediaItem, index: number) => {
    onItemClick?.(item, index);
  }, [onItemClick]);
  
  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    onAuthorClick?.(authorId);
  }, [onAuthorClick]);
  
  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="pb-4">
        <div 
          className={cn(
            'grid',
            mergedConfig.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
          )}
          style={{ gap: `${GRID_GAP_PX}px` }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">No posts yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Content will appear here
        </p>
      </div>
    );
  }
  
  // Determine tile variant for each item
  const getTileVariant = (item: UniversalMediaItem, index: number): 'portrait' | 'landscape' => {
    if (mergedConfig.layout === 'mixed-grid') {
      // Use orientation from item metadata
      return item.orientation === 'landscape' ? 'landscape' : 'portrait';
    }
    return 'portrait';
  };
  
  // Render grid based on layout type
  const renderGrid = () => {
    switch (mergedConfig.layout) {
      case 'hero-grid':
        const heroToShow = heroItem || processedItems[0];
        const gridItems = heroItem ? processedItems : processedItems.slice(1);
        
        return (
          <HeroGridLayout
            columns={mergedConfig.columns ?? 2}
            hero={
              heroToShow && (
                <HeroTile
                  item={heroToShow}
                  config={mergedConfig}
                  onPress={onHeroClick}
                  onAuthorClick={handleAuthorClick}
                />
              )
            }
          >
            {gridItems.map((item, index) => {
              const variant = getTileVariant(item, index);
              const actualIndex = heroItem ? index : index + 1;
              
              if (!shouldRender(actualIndex)) {
                return (
                  <TilePlaceholder
                    key={`placeholder-${item.id}`}
                    index={actualIndex}
                    variant={variant}
                    registerTile={registerTile}
                  />
                );
              }
              
              return (
                <MediaTile
                  key={`tile-${item.id}`}
                  item={item}
                  config={mergedConfig}
                  variant={variant}
                  index={actualIndex}
                  onPress={handleItemClick}
                  onAuthorClick={handleAuthorClick}
                  onFirstFrameReady={markReady}
                  isOwnPost={isOwnProfile}
                  onEdit={onEditPost}
                  onDelete={onDeletePost}
                />
              );
            })}
          </HeroGridLayout>
        );
        
      case 'mixed-grid':
        // Skip virtual scrolling for mixed-grid to prevent blank tiles
        return (
          <MixedGridLayout columns={mergedConfig.columns ?? 2}>
            {processedItems.map((item, index) => {
              const variant = getTileVariant(item, index);
              
              return (
                <MediaTile
                  key={`tile-${item.id}`}
                  item={item}
                  config={mergedConfig}
                  variant={variant}
                  index={index}
                  onPress={handleItemClick}
                  onAuthorClick={handleAuthorClick}
                  onFirstFrameReady={markReady}
                  isOwnPost={isOwnProfile}
                  onEdit={onEditPost}
                  onDelete={onDeletePost}
                />
              );
            })}
          </MixedGridLayout>
        );
        
      case 'portrait-grid':
      default:
        // Sentinel position: after first 5 items for early infinite scroll trigger
        const SENTINEL_AFTER_INDEX = 4; // 0-indexed, so after 5th item
        
        return (
          <PortraitGridLayout columns={mergedConfig.columns ?? 2}>
            {processedItems.map((item, index) => {
              const tile = !shouldRender(index) ? (
                <TilePlaceholder
                  key={`placeholder-${item.id}`}
                  index={index}
                  variant="portrait"
                  registerTile={registerTile}
                />
              ) : (
              <MediaTile
                  key={`tile-${item.id}`}
                  item={item}
                  config={mergedConfig}
                  variant="portrait"
                  index={index}
                  onPress={handleItemClick}
                  onAuthorClick={handleAuthorClick}
                  onFirstFrameReady={markReady}
                  isOwnPost={isOwnProfile}
                  onEdit={onEditPost}
                  onDelete={onDeletePost}
                />
              );
              
              // Insert sentinel after the 5th item (index 4)
              if (index === SENTINEL_AFTER_INDEX && mergedConfig.infiniteScroll) {
                return (
                  <React.Fragment key={`sentinel-group-${item.id}`}>
                    {tile}
                    <div 
                      ref={sentinelRef} 
                      data-scroll-sentinel 
                      className="col-span-full h-px"
                      aria-hidden="true"
                    />
                  </React.Fragment>
                );
              }
              
              return tile;
            })}
          </PortraitGridLayout>
        );
    }
  };
  
  return (
    <>
      <div ref={gridRef} className="pb-4">
        {renderGrid()}
      </div>
      
      {/* Loading indicator for infinite scroll */}
      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </>
  );
}

export default UniversalMediaGrid;
