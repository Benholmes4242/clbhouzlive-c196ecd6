/**
 * WatchShortsGrid - Video grid for Watch tab
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
  isVideoReady: boolean;
  onFirstFrameReady: () => void;
  onVisibilityChange: (index: number, isVisible: boolean) => void;
  isPriority: boolean;
  isAutoplayCandidate: boolean;
}

const CardWrapper = React.memo(function CardWrapper({
  video,
  index,
  shouldMount,
  onTap,
  isVideoReady,
  onFirstFrameReady,
  onVisibilityChange,
  isPriority,
  isAutoplayCandidate,
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

  return (
    <div ref={ref}>
      <WatchShortCard
        video={video}
        index={index}
        onTap={onTap}
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
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate
  );
});

// ============================================================================
// WatchShortsGrid Component
// ============================================================================

interface WatchShortsGridProps {
  shorts: WatchShort[];
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

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

export function WatchShortsGrid({
  shorts,
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
  
  // Track video IDs for prefetch system
  const videoIds = useMemo(() => {
    return shorts.map(short => {
      const streamId = uidFromNode({ src: short.media?.[0]?.media_url });
      return streamId || short.id;
    });
  }, [shorts]);
  
  // Create a stable map of stream UIDs to HLS URLs for actual prefetching
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    shorts.forEach(short => {
      if (short.media?.[0]?.media_url) {
        const streamId = uidFromNode({ src: short.media[0].media_url });
        if (streamId) {
          map.set(streamId, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [shorts]);
  
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
  const shortsLengthForMountRef = useRef(shorts.length);
  shortsLengthForMountRef.current = shorts.length;

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
  // LOAD MORE - SINGLE GUARD, NO COMPETING TIMEOUTS
  // =========================================================================
  const loadMoreInProgressRef = useRef(false);
  const lastLoadMoreTimeRef = useRef(0);

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '400px',
  });

  // Single effect that handles load more with proper guards
  useEffect(() => {
    if (!inView || !hasMore || isLoadingMore) return;
    
    // Synchronous guard - prevents parallel calls
    if (loadMoreInProgressRef.current) return;
    
    // Time-based guard - prevents rapid sequential calls
    const now = Date.now();
    if (now - lastLoadMoreTimeRef.current < LOAD_MORE_COOLDOWN_MS) return;
    
    // Set guards and execute
    loadMoreInProgressRef.current = true;
    lastLoadMoreTimeRef.current = now;
    
    onLoadMore();
  }, [inView, hasMore, isLoadingMore, onLoadMore]);

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
      <div className="pt-1 pb-4 px-[3px]">
        <div className="grid grid-cols-2 gap-[3px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={`aspect-[3/4] ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
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
    <div className="pt-1 pb-4 px-[3px]">
      {/* 2-column grid with 3px gap */}
      <div className="grid grid-cols-2 gap-[3px]">
        {shorts.map((video, index) => {
          const shouldMount = mountableIndices.has(index);
          const streamId = uidFromNode({ src: video.media?.[0]?.media_url }) || video.id;
          const videoReady = isReady(streamId);
          const isPriority = index < 6; // First 6 cards get priority loading
          
          // Diagonal/checkerboard autoplay pattern: only 1 card per row autoplays
          // Row 1: Left (0), Row 2: Right (3), Row 3: Left (4), Row 4: Right (7), etc.
          const isAutoplayCandidate = index % 4 === 0 || index % 4 === 3;
          
          return (
            <React.Fragment key={video.id}>
              <CardWrapper
                video={video}
                index={index}
                shouldMount={shouldMount}
                onTap={() => onVideoTap(video, index, shorts)}
                isVideoReady={videoReady}
                onFirstFrameReady={() => markReadyRef.current(streamId)}
                onVisibilityChange={handleVisibilityChange}
                isPriority={isPriority}
                isAutoplayCandidate={isAutoplayCandidate}
              />
              {/* Inject LiveClubhouseStrip after 8th tile (index 7) */}
              {showSuggestedStrip && index === 7 && (
                <div className="col-span-2 py-3 -mx-[3px]">
                  <LiveClubhouseStrip />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Loading boundary - shown when scrolling faster than videos can load */}
      <LoadingBoundary 
        isVisible={showLoadingBoundary} 
        variant="grid"
        message="Loading videos..."
      />

      {/* Infinite scroll sentinel with shimmer-down skeletons */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-2">
        {isLoadingMore && (
          <div className="grid grid-cols-2 gap-[3px] w-full">
            <Skeleton 
              className={`aspect-[3/4] ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
            />
            <Skeleton 
              className={`aspect-[3/4] ${prefersReducedMotion ? '' : 'animate-shimmer-down'}`}
              style={prefersReducedMotion ? undefined : { animationDelay: '50ms' }}
            />
          </div>
        )}
      </div>

      {/* All caught up message */}
      {!hasMore && shorts.length > 0 && !isLoading && !isLoadingMore && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
          <p className="text-xs font-medium">You're all caught up</p>
        </div>
      )}
    </div>
  );
}

export default WatchShortsGrid;
