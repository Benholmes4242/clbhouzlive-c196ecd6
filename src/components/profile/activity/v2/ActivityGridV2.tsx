/**
 * Activity Grid V2 - Premium PP → L Layout
 * 
 * UNIFIED WITH CLUBHOUSE: Video tiles handle their own visibility-based autoplay
 * - No external MediaRuntime coordination needed
 * - Each tile uses IntersectionObserver with 40% threshold
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import UnifiedMediaTile from '@/components/shared/grid/UnifiedMediaTile';
import LazyTilePlaceholder from '@/components/shared/grid/LazyTilePlaceholder';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import {
  LayoutBlock,
  DEFAULT_ACTIVITY_GRID_CONFIG,
  ActivityGridV2Config,
} from './types';
import { buildLayoutBlocks } from './layoutEngine';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

interface ActivityGridV2Props {
  items: UnifiedMediaItem[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: UnifiedMediaItem, index: number) => void;
  config?: Partial<ActivityGridV2Config>;
  isReady?: (id: string) => boolean;    // NEW: Video ready state checker
  onReady?: (id: string) => void;        // NEW: Video ready callback
  isFeedReady?: boolean;                 // NEW: Whether enough videos are ready
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean;
  /** Called when delete action triggered (only for own posts) */
  onDeletePost?: (postId: string) => void;
}

/**
 * Activity Grid V2 - Premium layout with PP → L pattern
 * 
 * Features:
 * - 2-column grid with 2px gap
 * - Portrait pairs (3:4) + Landscape hero (16:9)
 * - Cursor-based infinite scroll (stable append-only)
 * - Smart landscape detection with 5-item lookahead
 * - Hero portrait fallback for lone items
 * - Accessibility: respects prefers-reduced-motion
 */
const ActivityGridV2Inner: React.FC<ActivityGridV2Props> = ({
  items,
  isLoading = false,
  isFetchingNextPage = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  config: configOverrides,
  isReady = () => true,
  onReady,
  isFeedReady = true,
  isOwnProfile = false,
  onDeletePost,
}) => {
  const config = { ...DEFAULT_ACTIVITY_GRID_CONFIG, ...configOverrides };
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const renderTimeRef = useRef(performance.now());

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);


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

  // Autoplay candidates
  // IMPORTANT: Profile Activity expects all visible video tiles to autoplay.
  // MediaRuntime caps concurrency (MAX_CONCURRENT_PER_SURFACE['profile']).

  // Lazy loading
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: flatItems.length,
    initialVisible: 6,
    preloadViewports: 2,
    estimatedRowHeight: 250,
  });

  // Force initial tiles visible if lazy loading isn't populating correctly
  const effectiveVisibleIndices = useMemo(() => {
    // Start with a copy of visible indices
    const indices = new Set(visibleIndices);
    
    // Fallback: force first 6 to be visible if lazy loading returned empty
    if (indices.size === 0 && flatItems.length > 0) {
      for (let i = 0; i < Math.min(6, flatItems.length); i++) {
        indices.add(i);
      }
    }
    
    // Add buffer indices for smoother scrolling (2 items before/after each visible)
    visibleIndices.forEach(idx => {
      for (let offset = -2; offset <= 2; offset++) {
        const bufferIdx = idx + offset;
        if (bufferIdx >= 0 && bufferIdx < flatItems.length) {
          indices.add(bufferIdx);
        }
      }
    });
    
    return indices;
  }, [visibleIndices, flatItems.length]);

  // Store refs for scroll handler to avoid stale closures
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);
  const isFetchingRef = useRef(isFetchingNextPage);
  const onLoadMoreRef = useRef(onLoadMore);
  
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isFetchingRef.current = isFetchingNextPage; }, [isFetchingNextPage]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Infinite scroll using Intersection Observer - setup after items load
  useEffect(() => {
    // Don't set up until we have items and the grid has rendered
    if (flatItems.length === 0 || !hasMore || !onLoadMore) {
      return;
    }
    
    let observer: IntersectionObserver | null = null;
    let sentinel: HTMLDivElement | null = null;
    
    // Wait for next tick to ensure grid is in DOM
    const timeoutId = setTimeout(() => {
      const gridContainer = gridRef.current;
      if (!gridContainer) return;
      
      // Create sentinel element
      sentinel = document.createElement('div');
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';
      sentinel.dataset.infiniteScrollSentinel = 'true';
      gridContainer.appendChild(sentinel);
      
      // Observe when sentinel comes into view
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
  }, [flatItems.length, hasMore, onLoadMore]);


  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    onItemClick?.(item, index);
  }, [onItemClick]);

  // Loading state - staggered skeleton animation
  if ((isLoading && items.length === 0) || !isFeedReady) {
    return (
      <div className="pb-4">
        <div className="grid grid-cols-2" style={{ gap: `${config.gapPx}px` }}>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-[3/4] bg-muted/30 overflow-hidden relative"
              style={{ 
                animationDelay: `${i * 0.08}s`,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            >
              {/* Scroll-direction shimmer */}
              <div className="absolute inset-0 shimmer-down" />
            </div>
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
            const isVisible = effectiveVisibleIndices.has(flatIndex);
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

            // Render actual tile with accessibility
            return (
              <div
                key={`tile-${item.id}-${flatIndex}`}
                ref={(el) => registerTile(flatIndex, el)}
                data-tile-index={flatIndex}
                data-profile-post-id={item.postId || item.id}
                className={cn(
                  "relative overflow-hidden bg-muted/10 cursor-pointer",
                  "transition-transform duration-100 active:scale-[0.98]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isFullWidth && "col-span-2",
                  // Apply aspect ratio based on variant
                  variant === 'portrait' && "aspect-[3/4]",
                  variant === 'landscape' && "aspect-[16/9]",
                )}
                onClick={() => handleItemClick(item, flatIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item, flatIndex);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View ${item.type} post${item.creator?.name ? ` from ${item.creator.name}` : ''}`}
              >
                <UnifiedMediaTile
                  item={{
                    ...item,
                    // All visible videos are autoplay candidates on profile
                    isAutoplayCandidate: item.type === 'video',
                  }}
                  config={{
                    showCreator: config.showCreator ?? false,
                    showLikes: config.showLikes ?? true,
                    infiniteScroll: true,
                    autoplayEnabled: config.autoplayEnabled && !prefersReducedMotion,
                    surface: 'profile-activity',
                  }}
                  variant={isHero ? 'portrait' : variant}
                  index={flatIndex}
                  onPress={handleItemClick}
                  isVideoReady={(() => {
                    // Use Cloudflare UID for ready check (matches prefetch cache keys)
                    const cloudflareUid = extractCloudflareUid(item.playbackUrl || item.url || '');
                    return item.type === 'video' ? isReady(cloudflareUid || item.postId) : true;
                  })()}
                  onReady={onReady}
                  isOwnPost={isOwnProfile}
                  onDelete={onDeletePost}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading indicator for infinite scroll - staggered skeleton tiles */}
      {(isLoading || isFetchingNextPage) && items.length > 0 && (
        <div style={{ marginTop: `${config.gapPx}px` }}>
          <div className="grid grid-cols-2" style={{ gap: `${config.gapPx}px` }}>
            {/* First row: 2 portrait skeletons with staggered animation */}
            <div className="aspect-[3/4] bg-muted/30 rounded-md overflow-hidden relative" style={{ animationDelay: '0s' }}>
              <div className="absolute inset-0 shimmer-down" />
            </div>
            <div className="aspect-[3/4] bg-muted/30 rounded-md overflow-hidden relative" style={{ animationDelay: '0.1s' }}>
              <div className="absolute inset-0 shimmer-down" />
            </div>
            {/* Second row: 1 landscape skeleton spanning both columns */}
            <div className="col-span-2 aspect-[16/9] bg-muted/30 rounded-md overflow-hidden relative" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 shimmer-down" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Wrap in React.memo to prevent unnecessary re-renders from parent
const ActivityGridV2 = React.memo(ActivityGridV2Inner);

export default ActivityGridV2;
