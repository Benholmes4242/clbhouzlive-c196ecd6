import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreContentItem } from '@/components/explore/types';
import MediaTile from '@/components/grid/MediaTile';
import { useGridMediaRuntime } from '@/components/grid/hooks';
import { exploreItemsToUniversal, UniversalMediaItem, GRID_GAP_PX, AR_LANDSCAPE_THRESHOLD } from '@/components/grid';
import { cn } from '@/lib/utils';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem, index: number) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Pattern: 4 portraits + 1 landscape = 5 items per cycle
const PORTRAITS_PER_CYCLE = 4;
const CYCLE_SIZE = 5;
const INITIAL_TILES = 20; // 4 complete cycles

/**
 * ShortsGrid - Clean implementation
 * 
 * Pattern: 4 portrait tiles, then 1 landscape tile, repeating
 * Initial render: 20 tiles
 * Infinite scroll: Loads more before user reaches bottom
 */
export default function ShortsGrid({ 
  items, 
  onOpen, 
  isLoading = false, 
  hasMore = false, 
  onLoadMore,
  onLike,
  onAuthorClick,
  currentUserId
}: ShortsGridProps) {
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  
  // Keep refs in sync
  useEffect(() => {
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
  }, [hasMore, isLoading]);
  
  // Separate videos by orientation
  const { portraitVideos, landscapeVideos } = useMemo(() => {
    const portrait: ExploreContentItem[] = [];
    const landscape: ExploreContentItem[] = [];

    items.forEach(item => {
      const aspectRatio = item.aspectRatio || 
        (item.width && item.height && item.height > 0 ? item.width / item.height : 1);
      
      if (aspectRatio >= AR_LANDSCAPE_THRESHOLD || item.landscapeSuitable) {
        landscape.push(item);
      } else {
        portrait.push(item);
      }
    });

    return { portraitVideos: portrait, landscapeVideos: landscape };
  }, [items]);

  // Build grid with strict 4P + 1L pattern
  const gridItems = useMemo(() => {
    const result: { item: ExploreContentItem; variant: 'portrait' | 'landscape' }[] = [];
    let portraitIndex = 0;
    let landscapeIndex = 0;

    // Keep building cycles as long as we have content
    while (true) {
      // Check if we can complete another cycle
      const remainingPortraits = portraitVideos.length - portraitIndex;
      const remainingLandscapes = landscapeVideos.length - landscapeIndex;
      
      // Need 4 portraits and 1 landscape for a complete cycle
      if (remainingPortraits >= PORTRAITS_PER_CYCLE && remainingLandscapes >= 1) {
        // Add 4 portraits
        for (let i = 0; i < PORTRAITS_PER_CYCLE; i++) {
          result.push({ item: portraitVideos[portraitIndex++], variant: 'portrait' });
        }
        // Add 1 landscape
        result.push({ item: landscapeVideos[landscapeIndex++], variant: 'landscape' });
      } else {
        // Can't complete a cycle - add remaining portraits as partial
        while (portraitIndex < portraitVideos.length && result.length < items.length) {
          result.push({ item: portraitVideos[portraitIndex++], variant: 'portrait' });
        }
        break;
      }
    }

    return result;
  }, [portraitVideos, landscapeVideos, items.length]);

  // Convert to unified format for MediaTile
  const unifiedItems = useMemo(() => {
    return gridItems.map(({ item, variant }, index) => {
      const unified = exploreItemsToUniversal([item])[0];
      return {
        ...unified,
        tileVariant: variant,
        orientation: variant,
        isAutoplayCandidate: index % CYCLE_SIZE === 0 || index % CYCLE_SIZE === 4, // 1st portrait + landscape
      };
    });
  }, [gridItems]);

  // Grid config
  const gridConfig = useMemo(() => ({
    layout: 'mixed-grid' as const,
    columns: 2,
    autoplayPattern: 'custom' as const,
    surface: 'shorts' as const,
    showCreator: true,
    showLikes: true,
    showDuration: true,
    infiniteScroll: true,
    initialVisible: INITIAL_TILES,
    playThreshold: 0.4,
    pauseThreshold: 0.25,
  }), []);

  // Media runtime for autoplay
  const { registerMedia, playingIds } = useGridMediaRuntime({
    surface: 'shorts',
    maxConcurrent: 2,
    playThreshold: 0.4,
    pauseThreshold: 0.25,
    enabled: true,
  });

  // Infinite scroll - stable observer with refs
  useEffect(() => {
    if (!onLoadMore) return;
    
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        
        if (!hasMoreRef.current || loadingRef.current || isLoadingRef.current) {
          return;
        }

        loadingRef.current = true;
        onLoadMore();
        
        // Reset loading lock after delay
        setTimeout(() => {
          loadingRef.current = false;
        }, 500);
      },
      {
        root: null,
        rootMargin: '600px 0px', // Trigger 600px before bottom
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore]);

  // Handle item click
  const handleItemClick = useCallback((item: UniversalMediaItem, index: number) => {
    const originalItem = items.find(i => i.id === item.id);
    if (originalItem) {
      onOpen(originalItem, index);
    }
  }, [items, onOpen]);

  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    if (onAuthorClick) {
      onAuthorClick(authorId);
    } else {
      navigate(`/u/${authorId}`);
    }
  }, [navigate, onAuthorClick]);

  // Empty state
  if (unifiedItems.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">No shorts yet</h3>
        <p className="text-muted-foreground text-sm">Check back later for new content</p>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && unifiedItems.length === 0) {
    return (
      <div className="grid grid-cols-2" style={{ gap: `${GRID_GAP_PX}px` }}>
        {[...Array(INITIAL_TILES)].map((_, i) => {
          const isLandscape = (i + 1) % CYCLE_SIZE === 0;
          return (
            <div
              key={i}
              className={cn(
                'bg-muted/30 animate-pulse rounded-lg',
                isLandscape ? 'col-span-2 aspect-video' : 'aspect-[3/4]'
              )}
            />
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2" style={{ gap: `${GRID_GAP_PX}px` }}>
        {unifiedItems.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              item.tileVariant === 'landscape' && 'col-span-2'
            )}
          >
            <MediaTile
              item={item}
              config={gridConfig}
              variant={item.tileVariant || 'portrait'}
              index={index}
              onPress={handleItemClick}
              onAuthorClick={handleAuthorClick}
              registerMedia={registerMedia}
              isPlaying={playingIds.has(item.postId)}
            />
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px w-full" />

      {/* Loading spinner */}
      {isLoading && unifiedItems.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {/* All caught up */}
      {!hasMore && unifiedItems.length > 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </>
  );
}
