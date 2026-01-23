/**
 * Unified Media Grid - Single source of truth for Watch and Profile Activity grids
 * 
 * UNIFIED WITH CLUBHOUSE: Video tiles handle their own visibility-based autoplay
 * - No external MediaRuntime coordination needed
 * - Each tile uses IntersectionObserver with 40% threshold
 */
import React, { useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { UnifiedMediaGridProps, UnifiedMediaItem, GRID_GAP_PX } from './types';
import { buildUnifiedLayout, markAutoplayCandidates } from './layoutUtils';
import UnifiedMediaTile from './UnifiedMediaTile';
import LazyTilePlaceholder from './LazyTilePlaceholder';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { logGridMount, logGridDataReady } from '@/utils/gridAuditTimeline';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { useLazyTiles } from './useLazyTiles';

// Debug logging for video lifecycle analysis
const DEBUG_UNIFIED_GRID = true;
const logGrid = (event: string, data?: any) => {
  if (!DEBUG_UNIFIED_GRID) return;
  const timestamp = performance.now().toFixed(2);
  console.log(`[${timestamp}ms] [UnifiedMediaGrid] ${event}`, data || '');
};

/**
 * Unified Media Grid - Single source of truth for Watch and Profile Activity grids
 * 
 * Features:
 * - 2-column layout with 3:4 portrait tiles
 * - Metadata-driven landscape cards (16:9, full-width)
 * - Shared autoplay logic via useGridAutoplay
 * - Configurable overlays (creator, likes)
 * - Infinite scroll support
 * - Surface-aware tap behavior routing
 * 
 * Surfaces:
 * - 'watch': Tap opens Shorts Fullscreen Player
 * - 'profile-activity': Tap opens Post Viewer
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
  const hasPreloadedFirst = useRef(false);

  // Log mount - with audit timeline
  useEffect(() => {
    logGridMount(config.surface || 'unknown', items.length);
    logGrid('MOUNT', { 
      itemsCount: items.length,
      surface: config.surface,
      autoplayEnabled: config.autoplayEnabled
    });
    return () => {
      logGrid('UNMOUNT', { surface: config.surface });
    };
  }, []);

  // CRITICAL: Preload first video immediately in layout phase (before paint)
  // This eliminates the 2+ second React render delay on first load
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current) return;
    if (!items.length) return;

    // Find first video item
    const firstVideo = items.find(item => item.type === 'video');
    if (!firstVideo) return;

    hasPreloadedFirst.current = true;

    // Preload HLS manifest immediately
    const videoUrl = firstVideo.url;
    if (videoUrl) {
      const uid = uidFromNode({ src: videoUrl });
      if (uid) {
        const hlsUrl = generateStreamHlsUrl(uid);
        logGrid('LAYOUT_EFFECT_PRELOAD', { 
          id: firstVideo.id.slice(0, 8),
          hlsUrl: hlsUrl.slice(0, 50)
        });
        preloadHlsManifest(hlsUrl);
      }
    }
  }, [items]);


  // Mark autoplay candidates and build layout
  const processedItems = useMemo(() => {
    const marked = markAutoplayCandidates(items);
    logGridDataReady(config.surface || 'unknown', marked.length);
    logGrid('ITEMS_PROCESSED', { 
      total: items.length,
      autoplayCandidates: marked.filter(i => i.isAutoplayCandidate).length
    });
    return marked;
  }, [items, config.surface]);

  const layoutRows = useMemo(() => {
    return buildUnifiedLayout(processedItems);
  }, [processedItems]);

  // Build flat index map and flat item list for proper indexing + lazy loading
  const { itemIndexMap, flatItems } = useMemo(() => {
    const map = new Map<string, number>();
    const flat: Array<{ item: UnifiedMediaItem; variant: 'portrait' | 'landscape' }> = [];
    let flatIndex = 0;
    layoutRows.forEach(row => {
      const variant = row.type === 'landscape' ? 'landscape' : 'portrait';
      row.items.forEach(item => {
        map.set(item.id, flatIndex);
        flat.push({ item, variant });
        flatIndex++;
      });
    });
    return { itemIndexMap: map, flatItems: flat };
  }, [layoutRows]);

  // Lazy loading: only mount tiles in/near viewport
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: flatItems.length,
    initialVisible: 6, // First 3 rows (6 portrait tiles or mix)
    preloadViewports: 2,
    estimatedRowHeight: 250,
  });
  
  // Log lazy loading stats
  useEffect(() => {
    logGrid('LAZY_TILES_UPDATE', {
      totalItems: flatItems.length,
      visibleCount: visibleIndices.size,
      visibleIndices: Array.from(visibleIndices).slice(0, 10), // First 10 for brevity
    });
  }, [flatItems.length, visibleIndices]);

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

  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    onItemClick?.(item, index);
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
          {flatItems.map(({ item, variant }, flatIndex) => {
            const isVisible = visibleIndices.has(flatIndex);
            const isLandscape = variant === 'landscape';
            
            // Render placeholder for tiles not yet visible
            // This prevents all 19+ videos from mounting/loading simultaneously
            if (!isVisible) {
              return (
                <LazyTilePlaceholder
                  key={`placeholder-${item.id}-${flatIndex}`}
                  index={flatIndex}
                  variant={variant}
                  registerTile={registerTile}
                />
              );
            }
            
            // Render actual tile for visible items
            return (
              <UnifiedMediaTile
                key={`tile-${item.id}-${flatIndex}`}
                item={item}
                config={{ ...config, autoplayEnabled: config.autoplayEnabled ?? true }}
                variant={variant}
                index={flatIndex}
                onPress={handleItemClick}
                onAuthorClick={handleAuthorClick}
              />
            );
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
