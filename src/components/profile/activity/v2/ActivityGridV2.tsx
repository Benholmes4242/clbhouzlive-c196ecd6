/**
 * Activity Grid V2 - Unified Watch Tab Standard
 * 
 * All tiles are uniform 3:4 portrait in a 2-column grid (matches Watch tab)
 * - 3px gap and padding
 * - Diagonal autoplay pattern (index % 4 === 0 || index % 4 === 3)
 * - Paced infinite scroll with 600ms hold
 * - Grey shimmer loading states
 * - Fade-up entrance animation
 */

import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import UnifiedMediaTile from '@/components/shared/grid/UnifiedMediaTile';
import LazyTilePlaceholder from '@/components/shared/grid/LazyTilePlaceholder';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';
import { DEFAULT_ACTIVITY_GRID_CONFIG, ActivityGridV2Config } from './types';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

interface ActivityGridV2Props {
  items: UnifiedMediaItem[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: UnifiedMediaItem, index: number) => void;
  config?: Partial<ActivityGridV2Config>;
  isReady?: (id: string) => boolean;
  onReady?: (id: string) => void;
  isFeedReady?: boolean;
  isOwnProfile?: boolean;
  onEditPost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
}

// Paced loading constants (Watch tab standard)
const MIN_LOADING_DISPLAY_MS = 600;
const TILE_ENTRANCE_STAGGER_MS = 30;

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
  onEditPost,
  onDeletePost,
}) => {
  const config = { ...DEFAULT_ACTIVITY_GRID_CONFIG, ...configOverrides };
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // P0: Timeout fallback for persistent skeleton — force ready after 3s
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    if (items.length > 0 && !isFeedReady && !forceReady) {
      const timeout = setTimeout(() => setForceReady(true), 3000);
      return () => clearTimeout(timeout);
    }
  }, [items.length, isFeedReady, forceReady]);

  const effectiveFeedReady = isFeedReady || forceReady;

  // Reduced motion preference
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

  // =========================================================================
  // PACED LOADING STATE (Watch tab standard: 600ms minimum hold)
  // =========================================================================
  const loadStartTimeRef = useRef<number>(0);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const prevItemsCountRef = useRef(items.length);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const [renderedItems, setRenderedItems] = useState<UnifiedMediaItem[]>(items);

  // Handle paced loading when new items arrive
  useEffect(() => {
    const prevCount = prevItemsCountRef.current;
    const newCount = items.length;
    
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        setIsPacingDelay(true);
        const timer = setTimeout(() => {
          setRenderedItems(items);
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          setTimeout(() => setNewlyLoadedStartIndex(null), 500);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setRenderedItems(items);
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        setTimeout(() => setNewlyLoadedStartIndex(null), 500);
      }
    } else if (newCount !== prevCount) {
      setRenderedItems(items);
    }
    
    prevItemsCountRef.current = newCount;
  }, [items]);

  // Lazy loading
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: renderedItems.length,
    initialVisible: 6,
    preloadViewports: 2,
    estimatedRowHeight: 250,
  });

  // Force initial tiles visible
  const effectiveVisibleIndices = useMemo(() => {
    const indices = new Set(visibleIndices);
    if (indices.size === 0 && renderedItems.length > 0) {
      for (let i = 0; i < Math.min(6, renderedItems.length); i++) {
        indices.add(i);
      }
    }
    visibleIndices.forEach(idx => {
      for (let offset = -2; offset <= 2; offset++) {
        const bufferIdx = idx + offset;
        if (bufferIdx >= 0 && bufferIdx < renderedItems.length) {
          indices.add(bufferIdx);
        }
      }
    });
    return indices;
  }, [visibleIndices, renderedItems.length]);

  // Refs for infinite scroll
  const hasMoreRef = useRef(hasMore);
  const isFetchingRef = useRef(isFetchingNextPage);
  const onLoadMoreRef = useRef(onLoadMore);
  
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { isFetchingRef.current = isFetchingNextPage; }, [isFetchingNextPage]);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);

  // Infinite scroll with rootMargin: 0px (Watch tab standard - trigger at bottom)
  useEffect(() => {
    if (renderedItems.length === 0 || !hasMore || !onLoadMore) return;
    
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
            loadStartTimeRef.current = Date.now(); // Track load start for pacing
            onLoadMoreRef.current?.();
            setTimeout(() => { loadingRef.current = false; }, 1000);
          }
        },
        {
          rootMargin: '0px', // Watch tab standard: trigger at bottom
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
  }, [renderedItems.length, hasMore, onLoadMore]);

  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    onItemClick?.(item, index);
  }, [onItemClick]);

  // Show loading indicator
  const showBottomLoader = isFetchingNextPage || isPacingDelay;

  // Loading state - grey shimmer (Watch tab standard)
  if ((isLoading && items.length === 0) || !effectiveFeedReady) {
    return (
      <div className="pb-4">
        <div className="grid grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="aspect-[3/4] bg-muted overflow-hidden relative"
            >
              <div 
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-background/40 to-transparent" 
              />
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
        <div className="grid grid-cols-2">
          {renderedItems.map((item, index) => {
            const isVisible = effectiveVisibleIndices.has(index);
            
            // Diagonal autoplay pattern (Watch tab standard)
            const isAutoplayCandidate = item.type === 'video' && (index % 4 === 0 || index % 4 === 3);
            
            // Entrance animation for newly loaded tiles
            const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
            const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * TILE_ENTRANCE_STAGGER_MS : 0;

            // Placeholder for non-visible tiles
            if (!isVisible) {
              return (
                <LazyTilePlaceholder
                  key={`placeholder-${item.id}-${index}`}
                  index={index}
                  variant="portrait"
                  registerTile={registerTile}
                />
              );
            }

            // Render actual tile with fade-up animation
            return (
              <div
                key={`tile-${item.id}-${index}`}
                ref={(el) => registerTile(index, el)}
                data-tile-index={index}
                data-profile-post-id={item.postId || item.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer aspect-[3/4]",
                  "transition-transform duration-100 active:scale-[0.98]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  // Fade-up entrance animation (Watch tab standard)
                  isNewlyLoaded && !prefersReducedMotion && 'animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-backwards'
                )}
                style={isNewlyLoaded && !prefersReducedMotion ? { animationDelay: `${entranceDelay}ms` } : undefined}
                onClick={() => handleItemClick(item, index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item, index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View ${item.type} post${item.creator?.name ? ` from ${item.creator.name}` : ''}`}
              >
                <UnifiedMediaTile
                  item={{
                    ...item,
                    isAutoplayCandidate,
                  }}
                  config={{
                    showCreator: false, // Never show creator on profile (all same person)
                    showLikes: config.showLikes ?? true,
                    infiniteScroll: true,
                    autoplayEnabled: config.autoplayEnabled && !prefersReducedMotion,
                    surface: 'profile-activity',
                  }}
                  variant="portrait"
                  index={index}
                  onPress={handleItemClick}
                  isVideoReady={(() => {
                    const cloudflareUid = extractCloudflareUid(item.playbackUrl || item.url || '');
                    return item.type === 'video' ? isReady(cloudflareUid || item.postId) : true;
                  })()}
                  onReady={onReady}
                  isOwnPost={isOwnProfile}
                  onEdit={onEditPost}
                  onDelete={onDeletePost}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
      {showBottomLoader && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </>
  );
};

// Wrap in React.memo to prevent unnecessary re-renders from parent
const ActivityGridV2 = React.memo(ActivityGridV2Inner);

export default ActivityGridV2;
