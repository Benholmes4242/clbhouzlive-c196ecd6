// Activity Grid V2 - Premium PP → L Layout
// Implements Clubhouse signature pattern with stable infinite scroll

import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import UnifiedMediaTile from '@/components/shared/grid/UnifiedMediaTile';
import LazyTilePlaceholder from '@/components/shared/grid/LazyTilePlaceholder';
import { useMediaAutoplay } from '@/media';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import {
  LayoutBlock,
  DEFAULT_ACTIVITY_GRID_CONFIG,
  ActivityGridV2Config,
} from './types';
import { buildLayoutBlocks } from './layoutEngine';

interface ActivityGridV2Props {
  items: UnifiedMediaItem[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: UnifiedMediaItem, index: number) => void;
  config?: Partial<ActivityGridV2Config>;
}

const DEBUG = false;
const log = (msg: string, data?: any) => {
  if (!DEBUG) return;
  console.log(`[ActivityGridV2] ${msg}`, data || '');
};

/**
 * Activity Grid V2 - Premium layout with PP → L pattern
 * 
 * Features:
 * - 2-column grid with 2px gap
 * - Portrait pairs (3:4) + Landscape hero (16:9)
 * - Cursor-based infinite scroll (stable append-only)
 * - Smart landscape detection with 5-item lookahead
 * - Hero portrait fallback for lone items
 */
const ActivityGridV2: React.FC<ActivityGridV2Props> = ({
  items,
  isLoading = false,
  isFetchingNextPage = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  config: configOverrides,
}) => {
  const config = { ...DEFAULT_ACTIVITY_GRID_CONFIG, ...configOverrides };
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Set up autoplay
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    startThreshold: config.playThreshold,
    stopThreshold: 1 - config.pauseThreshold,
  });

  // Build layout from items (memoized)
  const layoutBlocks = useMemo(() => {
    return buildLayoutBlocks(items, hasMore, config);
  }, [items, hasMore, config.landscapeLookahead]);

  // Flatten blocks to items for lazy loading and indexing
  const flatItems = useMemo(() => {
    const flat: Array<{ item: UnifiedMediaItem; variant: 'portrait' | 'landscape'; isHero: boolean }> = [];
    
    layoutBlocks.forEach(block => {
      const isLandscape = block.type === 'landscape';
      const isHero = block.type === 'hero-portrait';
      
      block.items.forEach(item => {
        flat.push({ 
          item, 
          variant: isLandscape || isHero ? 'landscape' : 'portrait',
          isHero,
        });
      });
    });
    
    return flat;
  }, [layoutBlocks]);

  // Lazy loading
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: flatItems.length,
    initialVisible: 6,
    preloadViewports: 2,
    estimatedRowHeight: 250,
  });

  // Infinite scroll handler
  useEffect(() => {
    if (!onLoadMore) return;

    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading || isFetchingNextPage) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800;

      if (scrollTop > scrollThreshold) {
        loadingRef.current = true;
        onLoadMore();
        // Debounce - 1 second lockout
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, isFetchingNextPage, onLoadMore]);

  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    onItemClick?.(item, index);
  }, [onItemClick]);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="pb-4">
        <div className="grid grid-cols-2" style={{ gap: `${config.gapPx}px` }}>
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

  return (
    <>
      <div ref={gridRef} className="pb-4">
        <div className="grid grid-cols-2" style={{ gap: `${config.gapPx}px` }}>
          {flatItems.map(({ item, variant, isHero }, flatIndex) => {
            const isVisible = visibleIndices.has(flatIndex);
            const isFullWidth = variant === 'landscape';

            // Placeholder for non-visible tiles
            if (!isVisible) {
              return (
                <div
                  key={`placeholder-${item.id}-${flatIndex}`}
                  className={isFullWidth ? 'col-span-2' : ''}
                >
                  <LazyTilePlaceholder
                    index={flatIndex}
                    variant={variant}
                    registerTile={registerTile}
                  />
                </div>
              );
            }

            // Render actual tile
            return (
              <div
                key={`tile-${item.id}-${flatIndex}`}
                className={isFullWidth ? 'col-span-2' : ''}
              >
                <UnifiedMediaTile
                  item={item}
                  config={{
                    showCreator: false,
                    showLikes: true,
                    infiniteScroll: true,
                    autoplayEnabled: config.autoplayEnabled,
                    surface: 'profile-activity',
                  }}
                  variant={isHero ? 'portrait' : variant}
                  index={flatIndex}
                  onPress={handleItemClick}
                  registerVideo={registerMedia}
                  isPlaying={playingIds.has(item.postId)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator for infinite scroll */}
      {(isLoading || isFetchingNextPage) && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </>
  );
};

export default ActivityGridV2;
