import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaGridProps, UnifiedMediaItem, GRID_GAP_PX } from './types';
import { buildUnifiedLayout, markAutoplayCandidates } from './layoutUtils';
import UnifiedMediaTile from './UnifiedMediaTile';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';

/**
 * Unified Media Grid - Single source of truth for Watch and Profile Activity grids
 * 
 * Features:
 * - 2-column layout with 3:4 portrait tiles
 * - Metadata-driven landscape cards (16:9, full-width)
 * - Shared autoplay logic via useGridAutoplay
 * - Configurable overlays (creator, likes)
 * - Infinite scroll support
 */
const UnifiedMediaGrid: React.FC<UnifiedMediaGridProps> = ({
  items,
  config,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  onLike,
  onAuthorClick,
  currentUserId,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Set up autoplay hook
  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: config.maxAutoplay ?? 2,
    visibilityThreshold: config.visibilityThreshold ?? 0.6,
  });

  // Mark autoplay candidates and build layout
  const processedItems = useMemo(() => {
    return markAutoplayCandidates(items);
  }, [items]);

  const layoutRows = useMemo(() => {
    return buildUnifiedLayout(processedItems);
  }, [processedItems]);

  // Infinite scroll handler
  useEffect(() => {
    if (!config.infiniteScroll || !onLoadMore) return;

    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800;

      if (scrollTop > scrollThreshold) {
        loadingRef.current = true;
        onLoadMore();
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [config.infiniteScroll, hasMore, isLoading, onLoadMore]);

  const handleItemClick = useCallback((item: UnifiedMediaItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  const handleAuthorClick = useCallback((authorId: string) => {
    onAuthorClick?.(authorId);
  }, [onAuthorClick]);

  // Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="pb-4">
        <div className="grid grid-cols-2" style={{ gap: `${GRID_GAP_PX}px` }}>
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
        <div className="grid grid-cols-2" style={{ gap: `${GRID_GAP_PX}px` }}>
          {layoutRows.map((row, rowIndex) => {
            if (row.type === 'landscape') {
              const item = row.items[0];
              return (
                <UnifiedMediaTile
                  key={`landscape-${item.id}-${rowIndex}`}
                  item={item}
                  config={{ ...config, autoplayEnabled: config.autoplayEnabled ?? true }}
                  variant="landscape"
                  onPress={handleItemClick}
                  onAuthorClick={handleAuthorClick}
                  registerVideo={registerVideo}
                  isPlaying={playingIds.has(item.postId)}
                />
              );
            }

            // Portrait pair
            return row.items.map((item, itemIndex) => (
              <UnifiedMediaTile
                key={`portrait-${item.id}-${rowIndex}-${itemIndex}`}
                item={item}
                config={{ ...config, autoplayEnabled: config.autoplayEnabled ?? true }}
                variant="portrait"
                onPress={handleItemClick}
                onAuthorClick={handleAuthorClick}
                registerVideo={registerVideo}
                isPlaying={playingIds.has(item.postId)}
              />
            ));
          })}
        </div>
      </div>

      {/* Loading indicator for infinite scroll */}
      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </>
  );
};

export default UnifiedMediaGrid;
