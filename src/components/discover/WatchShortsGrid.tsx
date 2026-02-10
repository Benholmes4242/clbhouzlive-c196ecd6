/**
 * WatchShortsGrid - Video grid for Watch tab
 * 
 * INSTAGRAM-STYLE PACED INFINITE SCROLL:
 * - Visible loading boundary with pulsing dots when fetching more
 * - Minimum 600ms "breathing moment" before new tiles appear
 * - Staggered fade-up entrance animation for new tiles
 * - Native iOS rubber-band bounce preserved
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Adaptive prefetch (3-20 range) based on network/battery/scroll speed
 * - Scroll velocity tracking with EWMA smoothing
 * - Memory pressure awareness (85% heap threshold)
 * - Shimmer-down skeleton animations with staggered delays
 * - Reduced motion support
 * - Preload hint scheduling via preloadHlsManifest
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatchShortCard } from './WatchShortCard';
import { WatchShort } from '@/hooks/useWatchShorts';
import { useAdaptivePrefetch } from '@/hooks/useAdaptivePrefetch';
import { LoadingBoundary } from '@/components/ui/LoadingBoundary';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { 
  DEBUG_WATCH, 
  logWatch, 
  logWatchVisibility, 
  createWatchLifecycleLogger,
} from './debug';
import { LiveClubhouseStrip } from '@/components/shorts/LiveClubhouseStrip';

// ============================================================================
// CardWrapper - MOVED OUTSIDE to prevent recreation on parent re-renders
// ============================================================================
interface CardWrapperProps {
  video: WatchShort;
  index: number;
  shouldMount: boolean;
  onTap: () => void;
  isLikedByMe: boolean;
  isVideoReady: boolean;
  onFirstFrameReady: () => void;
  onVisibilityChange: (index: number, isVisible: boolean) => void;
  isPriority: boolean;
  isAutoplayCandidate: boolean;
  /** Whether this tile is from a newly loaded batch (for entrance animation) */
  isNewlyLoaded?: boolean;
  /** Animation delay for staggered entrance */
  entranceDelay?: number;
}

const CardWrapper = React.memo(function CardWrapper({
  video,
  index,
  shouldMount,
  onTap,
  isLikedByMe,
  isVideoReady,
  onFirstFrameReady,
  onVisibilityChange,
  isPriority,
  isAutoplayCandidate,
  isNewlyLoaded = false,
  entranceDelay = 0,
}: CardWrapperProps) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Store callback in ref to avoid re-triggering effect when callback changes
  const onVisibilityChangeRef = useRef(onVisibilityChange);
  onVisibilityChangeRef.current = onVisibilityChange;

  // Report visibility changes to parent using ref to avoid effect re-runs
  useEffect(() => {
    onVisibilityChangeRef.current(index, inView);
  }, [index, inView]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div 
      ref={ref}
      className={isNewlyLoaded && !prefersReducedMotion 
        ? 'animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-backwards' 
        : undefined
      }
      style={isNewlyLoaded && !prefersReducedMotion 
        ? { animationDelay: `${entranceDelay}ms` } 
        : undefined
      }
    >
      <WatchShortCard
        video={video}
        index={index}
        onTap={onTap}
        isLikedByMe={isLikedByMe}
        shouldMountVideo={shouldMount}
        isVisible={inView}
        isVideoReady={isVideoReady}
        onFirstFrameReady={onFirstFrameReady}
        isPriority={isPriority}
        isAutoplayCandidate={isAutoplayCandidate}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.index === nextProps.index &&
    prevProps.shouldMount === nextProps.shouldMount &&
    prevProps.isLikedByMe === nextProps.isLikedByMe &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate &&
    prevProps.isNewlyLoaded === nextProps.isNewlyLoaded &&
    prevProps.entranceDelay === nextProps.entranceDelay
  );
});

// ============================================================================
// WatchShortsGrid Component
// ============================================================================

interface WatchShortsGridProps {
  shorts: WatchShort[];
  likedPostIds?: Set<string>;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onVideoTap: (video: WatchShort, index: number, allVideos: WatchShort[]) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  /** Whether to show the suggested strip inline after 8 tiles */
  showSuggestedStrip?: boolean;
}

// Number of items to mount beyond visible area
const MOUNT_BUFFER = 18;

// Debounce settings for LOAD MORE
const LOAD_MORE_COOLDOWN_MS = 300;

// Minimum time to show loading state before revealing new tiles (Instagram-style pacing)
const MIN_LOADING_DISPLAY_MS = 600;

// Stagger delay between each new tile's entrance animation
const TILE_ENTRANCE_STAGGER_MS = 30;

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

export function WatchShortsGrid({
  shorts,
  likedPostIds = new Set(),
  isLoading,
  isError,
  onRetry,
  onVideoTap,
  onLoadMore,
  hasMore,
  isLoadingMore,
  showSuggestedStrip = false,
}: WatchShortsGridProps) {
  // Debug lifecycle
  const lifecycleLogger = createWatchLifecycleLogger('WatchShortsGrid');
  
  useEffect(() => {
    lifecycleLogger.onMount({ shortsCount: shorts.length });
    return () => lifecycleLogger.onUnmount();
  }, []);

  // Log shorts data changes
  useEffect(() => {
    if (DEBUG_WATCH && shorts.length > 0) {
      logWatch('data', 'WatchShortsGrid', `📊 Shorts updated: ${shorts.length} items`, {
        hasMore,
        isLoadingMore,
      });
    }
  }, [shorts.length, hasMore, isLoadingMore]);

  // P1: Adaptive prefetch with scroll velocity tracking
  const { config: prefetchConfig, onIndexChange } = useAdaptivePrefetch();
  
  // Track ready videos
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  const markReady = useCallback((id: string) => {
    setReadySet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const isReady = useCallback((id: string) => readySet.has(id), [readySet]);

  const [showLoadingBoundary, setShowLoadingBoundary] = useState(false);
  
  // =========================================================================
  // INSTAGRAM-STYLE PACED LOADING STATE
  // =========================================================================
  
  // Track when load started for minimum display time
  const loadStartTimeRef = useRef<number>(0);
  
  // Track which indices are "newly loaded" for entrance animation
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  
  // Track the previous shorts count to detect new items
  const prevShortsCountRef = useRef(shorts.length);
  
  // Whether we're in the "pacing delay" period (data arrived but waiting for min time)
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  
  // The actual shorts to render (may be delayed for pacing)
  const [renderedShorts, setRenderedShorts] = useState<WatchShort[]>(shorts);
  
  // Handle paced loading when new shorts arrive
  useEffect(() => {
    const prevCount = prevShortsCountRef.current;
    const newCount = shorts.length;
    
    // New items arrived
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        // Enter pacing delay - keep showing old items + loading indicator
        setIsPacingDelay(true);
        
        const timer = setTimeout(() => {
          // Now reveal the new items with animation
          setRenderedShorts(shorts);
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          
          // Clear the "newly loaded" state after animations complete
          setTimeout(() => {
            setNewlyLoadedStartIndex(null);
          }, 500);
        }, remaining);
        
        return () => clearTimeout(timer);
      } else {
        // Already waited long enough, show immediately
        setRenderedShorts(shorts);
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        
        // Clear the "newly loaded" state after animations complete
        setTimeout(() => {
          setNewlyLoadedStartIndex(null);
        }, 500);
      }
    } else if (newCount !== prevCount) {
      // Initial load or refresh - no animation needed
      setRenderedShorts(shorts);
    }
    
    prevShortsCountRef.current = newCount;
  }, [shorts]);
  
  // Track video IDs for prefetch system
  const videoIds = useMemo(() => {
    return renderedShorts.map(short => {
      const streamId = uidFromNode({ src: short.media?.[0]?.media_url });
      return streamId || short.id;
    });
  }, [renderedShorts]);
  
  // Create a stable map of stream UIDs to HLS URLs for actual prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    renderedShorts.forEach(short => {
      if (short.media?.[0]?.media_url) {
        const streamId = uidFromNode({ src: short.media[0].media_url });
        if (streamId) {
          map.set(streamId, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [renderedShorts]);
  
  // Refs for stable references
  const videoIdsRef = useRef(videoIds);
  videoIdsRef.current = videoIds;
  const videoUrlMapRef = useRef(videoUrlMap);
  videoUrlMapRef.current = videoUrlMap;
  
  // Track which items are currently visible
  const visibleIndicesRef = useRef(new Set<number>());
  const [mountableIndices, setMountableIndices] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4, 5]));
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // REF for shorts.length to avoid dependency in updateMountableIndices
  const shortsLengthForMountRef = useRef(renderedShorts.length);
  shortsLengthForMountRef.current = renderedShorts.length;

  // =========================================================================
  // P1: PRELOAD HINT SCHEDULING - Prefetch manifests for upcoming videos
  // =========================================================================
  const schedulePrefetch = useCallback((currentIndex: number) => {
    const { prefetchAhead } = prefetchConfig;
    const ids = videoIdsRef.current;
    const urlMap = videoUrlMapRef.current;
    
    // Prefetch ahead based on adaptive config
    for (let i = 1; i <= prefetchAhead && currentIndex + i < ids.length; i++) {
      const id = ids[currentIndex + i];
      const url = urlMap.get(id);
      if (url) {
        preloadHlsManifest(url);
      }
    }
  }, [prefetchConfig]);

  // =========================================================================
  // LOAD MORE - WITH PACING SUPPORT
  // =========================================================================
  const loadMoreInProgressRef = useRef(false);
  const lastLoadMoreTimeRef = useRef(0);

  // Infinite scroll trigger - rootMargin: 0px for Instagram-style (load at bottom)
  const { ref: loadMoreRef, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '0px', // Changed from 400px - only trigger when user reaches bottom
  });

  // Single effect that handles load more with proper guards
  useEffect(() => {
    // Don't trigger load more if we haven't loaded initial data yet
    if (shorts.length === 0) return;

    if (!inView || !hasMore || isLoadingMore || isPacingDelay) return;
    
    // Synchronous guard - prevents parallel calls
    if (loadMoreInProgressRef.current) return;
    
    // Time-based guard - prevents rapid sequential calls
    const now = Date.now();
    if (now - lastLoadMoreTimeRef.current < LOAD_MORE_COOLDOWN_MS) return;
    
    // Set guards and execute
    loadMoreInProgressRef.current = true;
    lastLoadMoreTimeRef.current = now;
    loadStartTimeRef.current = now; // Track when load started for pacing
    
    onLoadMore();
  }, [inView, hasMore, isLoadingMore, isPacingDelay, onLoadMore, shorts.length]);

  // Reset synchronous guard when loading completes
  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreInProgressRef.current = false;
    }
  }, [isLoadingMore]);

  // Debounced update of mountable indices
  const updateMountableIndices = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const currentLength = shortsLengthForMountRef.current;
      const indices = new Set<number>();
      
      visibleIndicesRef.current.forEach(idx => {
        indices.add(idx);
        for (let i = 1; i <= MOUNT_BUFFER; i++) {
          if (idx - i >= 0) indices.add(idx - i);
          if (idx + i < currentLength) indices.add(idx + i);
        }
      });
      
      if (indices.size === 0) {
        for (let i = 0; i < Math.min(6, currentLength); i++) {
          indices.add(i);
        }
      }
      
      setMountableIndices(indices);
    }, 100);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Handle visibility changes from individual cards via intersection observer
  const handleVisibilityChange = useCallback((index: number, isVisible: boolean) => {
    if (isVisible) {
      visibleIndicesRef.current.add(index);
      
      if (DEBUG_WATCH && index % 6 === 0) {
        logWatchVisibility('WatchShortsGrid', `Video ${index} became visible`, {
          visibleCount: visibleIndicesRef.current.size,
        });
      }
      
      // P1: Scroll velocity tracking - notify adaptive prefetch (no args needed)
      onIndexChange();
      
      // P1: Schedule manifest prefetch for upcoming videos
      schedulePrefetch(index);
    } else {
      visibleIndicesRef.current.delete(index);
    }
    updateMountableIndices();
  }, [updateMountableIndices, onIndexChange, schedulePrefetch]);
  
  // Store handleVisibilityChange in ref for CardWrapper to use
  const handleVisibilityChangeRef = useRef(handleVisibilityChange);
  handleVisibilityChangeRef.current = handleVisibilityChange;
  
  // Separate effect to handle boundary visibility
  useEffect(() => {
    const maxVisibleIndex = Math.max(...Array.from(visibleIndicesRef.current), 0);
    const readyCount = readySet.size;
    
    // Show loading boundary if we're approaching unready videos
    if (maxVisibleIndex >= readyCount - 4 && readyCount < videoIds.length - 1) {
      setShowLoadingBoundary(true);
    } else if (readyCount > maxVisibleIndex + 6) {
      setShowLoadingBoundary(false);
    }
  }, [readySet, videoIds]);

  // Stable callback ref for onFirstFrameReady
  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;

  // Error state with retry
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-1">Something went wrong</p>
        <p className="text-muted-foreground text-sm text-center mb-4">
          We couldn't load the videos
        </p>
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    );
  }

  // P2: Shimmer-down skeleton with staggered delays
  if (isLoading && shorts.length === 0) {
    return (
      <div className="pt-1 pb-4 px-4">
        <div className="grid grid-cols-2 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`aspect-[3/4] rounded-xl ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
              style={prefersReducedMotion ? undefined : { animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Video className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-semibold mb-1">No videos yet</p>
        <p className="text-muted-foreground text-sm text-center max-w-[280px]">
          Check back later for new content from golfers around the world
        </p>
      </div>
    );
  }

  return (
    <div className="pt-1 pb-4 px-4">
      {/* 2-column grid with 4px gap */}
      <div className="grid grid-cols-2 gap-1">
        {renderedShorts.map((video, index) => {
          const shouldMount = mountableIndices.has(index);
          const streamId = uidFromNode({ src: video.media?.[0]?.media_url }) || video.id;
          const videoReady = isReady(streamId);
          const isPriority = index < 6;
          
          const isAutoplayCandidate = index % 4 === 0 || index % 4 === 3;
          
          const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
          const entranceDelay = isNewlyLoaded 
            ? (index - newlyLoadedStartIndex!) * TILE_ENTRANCE_STAGGER_MS 
            : 0;
          
          return (
            <div key={video.id} className="contents">
              <CardWrapper
                video={video}
                index={index}
                shouldMount={shouldMount}
                onTap={() => onVideoTap(video, index, renderedShorts)}
                isLikedByMe={likedPostIds.has(video.id)}
                isVideoReady={videoReady}
                onFirstFrameReady={() => markReadyRef.current(streamId)}
                onVisibilityChange={handleVisibilityChange}
                isPriority={isPriority}
                isAutoplayCandidate={isAutoplayCandidate}
                isNewlyLoaded={isNewlyLoaded}
                entranceDelay={entranceDelay}
              />
              {/* Inject Suggested strip after 8th tile (index 7) */}
              {showSuggestedStrip && index === 7 && (
                <div className="col-span-2 py-4 -mx-4">
                  {/* Section header for suggested accounts */}
                  <div className="mb-3 px-4">
                    <span className="text-base font-semibold" style={{ color: '#374151' }}>
                      Suggested for You
                    </span>
                  </div>
                  <LiveClubhouseStrip />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Loading boundary - shown when scrolling faster than videos can load */}
      <LoadingBoundary 
        isVisible={showLoadingBoundary} 
        variant="grid"
        message="Loading videos..."
      />

      {/* Infinite scroll sentinel - trigger early */}
      <div ref={loadMoreRef} className="h-20" />

      {/* All caught up message */}
      {!hasMore && shorts.length > 0 && !isLoading && !isLoadingMore && !isPacingDelay && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
          <p className="text-xs font-medium">You're all caught up</p>
        </div>
      )}
    </div>
  );
}

export default WatchShortsGrid;
