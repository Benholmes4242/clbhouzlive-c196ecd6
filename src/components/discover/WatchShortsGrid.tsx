/**
 * WatchShortsGrid - Video grid for Watch tab with MEDIARUNTIME INTEGRATION
 * 
 * Features:
 * - 2-column grid layout
 * - 2px gap between items
 * - Infinite scroll with intersection observer + DEBOUNCING
 * - LAZY MOUNTING: Only mounts HLSPlayer for visible + buffer items
 * - MEDIARUNTIME: Routes all playback through MediaRuntime for coordinated control
 * - Loading skeletons
 * - Empty state
 * - Error state with retry
 * - HLS PREFETCH: Actually preloads video manifests for upcoming videos
 * 
 * MEDIARUNTIME FIX (Jan 2026):
 * - All playback now goes through MediaRuntime via useWatchRuntimeBridge
 * - HLSPlayer autoplay prop is controlled by MediaRuntime, not visibility alone
 * - Generation tracking prevents stale play attempts
 * - LOAD MORE calls are debounced to prevent duplicate requests
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatchShortCard } from './WatchShortCard';
import { WatchShort } from '@/hooks/useWatchShorts';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { LoadingBoundary } from '@/components/ui/LoadingBoundary';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { useWatchRuntimeBridge } from '@/hooks/useWatchRuntimeBridge';

// ============================================================================
// CardWrapper - MOVED OUTSIDE to prevent recreation on parent re-renders
// This is critical for preventing video remounting during pagination
// ============================================================================
interface CardWrapperProps {
  video: WatchShort;
  index: number;
  shouldMount: boolean;
  onTap: () => void;
  isAutoplayCandidate: boolean;
  isVideoReady: boolean;
  onFirstFrameReady: () => void;
  onVisibilityChange: (index: number, isVisible: boolean) => void;
  onVideoRef: (videoId: string, el: HTMLVideoElement | null) => void;
}

const CardWrapper = React.memo(function CardWrapper({
  video,
  index,
  shouldMount,
  onTap,
  isAutoplayCandidate,
  isVideoReady,
  onFirstFrameReady,
  onVisibilityChange,
  onVideoRef,
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
        isAutoplayCandidate={isAutoplayCandidate}
        shouldMountVideo={shouldMount}
        isVisible={inView}
        isVideoReady={isVideoReady}
        onFirstFrameReady={onFirstFrameReady}
        onVideoRef={onVideoRef}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // NOTE: onVisibilityChange and onVideoRef intentionally excluded - we use ref pattern
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.index === nextProps.index &&
    prevProps.shouldMount === nextProps.shouldMount &&
    prevProps.isAutoplayCandidate === nextProps.isAutoplayCandidate &&
    prevProps.isVideoReady === nextProps.isVideoReady
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
}

// Number of items to mount beyond visible area (~3 pages worth for Instagram-style prefetch)
const MOUNT_BUFFER = 18;

// Debounce settings for LOAD MORE
const LOAD_MORE_DEBOUNCE_MS = 150;

export function WatchShortsGrid({
  shorts,
  isLoading,
  isError,
  onRetry,
  onVideoTap,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: WatchShortsGridProps) {
  // Video ready queue for Instagram-style prefetch
  const {
    readySet,
    isReady,
    markReady,
    getReadyBoundaryIndex,
    initiatePrefetch,
  } = useVideoReadyQueue({
    prefetchAhead: 18, // ~3 pages for grid
    prefetchBehind: 12,
    readyTimeout: 10000,
  });

  const [showLoadingBoundary, setShowLoadingBoundary] = useState(false);
  
  // Track video IDs for prefetch system
  // CRITICAL: Use stream UIDs, not post IDs, for cache consistency
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
  
  // Refs to hold stable references for prefetch
  const videoIdsRef = useRef(videoIds);
  videoIdsRef.current = videoIds;
  const videoUrlMapRef = useRef(videoUrlMap);
  videoUrlMapRef.current = videoUrlMap;
  const initiatePrefetchRef = useRef(initiatePrefetch);
  initiatePrefetchRef.current = initiatePrefetch;
  
  // Initialize prefetch when videos change
  const shortsLengthRef = useRef(0);
  useEffect(() => {
    if (shorts.length !== shortsLengthRef.current && shorts.length > 0) {
      shortsLengthRef.current = shorts.length;
      initiatePrefetchRef.current(videoIdsRef.current, 0, videoUrlMapRef.current);
    }
  }, [shorts.length]);
  
  // Track which items are currently visible
  const visibleIndicesRef = useRef(new Set<number>());
  const [mountableIndices, setMountableIndices] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4, 5]));
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // REF for shorts.length to avoid dependency in updateMountableIndices
  const shortsLengthForMountRef = useRef(shorts.length);
  shortsLengthForMountRef.current = shorts.length;

  // =========================================================================
  // LOAD MORE with debouncing to prevent duplicate calls
  // =========================================================================
  const loadMoreDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingMoreRef = useRef(false);
  isLoadingMoreRef.current = isLoadingMore;
  
  const debouncedLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current) {
      console.log('[WatchShortsGrid] Load more skipped - already loading');
      return;
    }
    
    if (loadMoreDebounceRef.current) {
      clearTimeout(loadMoreDebounceRef.current);
    }
    
    loadMoreDebounceRef.current = setTimeout(() => {
      console.log('[WatchShortsGrid] Load more executing');
      onLoadMore();
    }, LOAD_MORE_DEBOUNCE_MS);
  }, [onLoadMore]);

  // Infinite scroll trigger with debouncing
  const { ref: loadMoreRef, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      debouncedLoadMore();
    }
  }, [inView, hasMore, isLoadingMore, debouncedLoadMore]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
      }
    };
  }, []);

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

  // =========================================================================
  // VIDEO REFS for MediaRuntime integration
  // =========================================================================
  const videoRefsMap = useRef<Map<string, HTMLVideoElement | null>>(new Map());
  
  const handleVideoRef = useCallback((videoId: string, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefsMap.current.set(videoId, el);
    } else {
      videoRefsMap.current.delete(videoId);
    }
  }, []);

  // =========================================================================
  // AUTOPLAY CANDIDATE - determine which video should autoplay
  // =========================================================================
  const [autoplayCandidateIndex, setAutoplayCandidateIndex] = useState<number | null>(null);
  
  // Calculate autoplay candidate (first + every 3rd that is visible)
  const isAutoplayPattern = (index: number) => index === 0 || index % 3 === 0;
  
  // Update autoplay candidate when visibility changes
  useEffect(() => {
    const visibleAutoplayIndices = Array.from(visibleIndicesRef.current)
      .filter(isAutoplayPattern)
      .sort((a, b) => a - b);
    
    // Pick the first visible autoplay candidate
    const newCandidate = visibleAutoplayIndices[0] ?? null;
    
    if (newCandidate !== autoplayCandidateIndex) {
      setAutoplayCandidateIndex(newCandidate);
    }
  }, [mountableIndices]); // Triggered when mountable indices update (visibility changed)

  // =========================================================================
  // MEDIARUNTIME BRIDGE - Routes all playback through MediaRuntime
  // =========================================================================
  useWatchRuntimeBridge({
    shorts,
    mountableIndices,
    visibleIndices: visibleIndicesRef.current,
    autoplayCandidateIndex,
    videoRefs: videoRefsMap,
  });

  // Handle visibility changes from individual cards via intersection observer
  const handleVisibilityChange = useCallback((index: number, isVisible: boolean) => {
    if (isVisible) {
      visibleIndicesRef.current.add(index);
      
      // Trigger prefetch using refs
      if (videoUrlMapRef.current.size > 0) {
        initiatePrefetchRef.current(videoIdsRef.current, index, videoUrlMapRef.current);
      }
    } else {
      visibleIndicesRef.current.delete(index);
    }
    updateMountableIndices();
  }, [updateMountableIndices]);
  
  // Store handleVisibilityChange in ref for CardWrapper to use
  const handleVisibilityChangeRef = useRef(handleVisibilityChange);
  handleVisibilityChangeRef.current = handleVisibilityChange;
  
  // Separate effect to handle boundary visibility
  useEffect(() => {
    const boundaryIndex = getReadyBoundaryIndex(videoIds);
    const maxVisibleIndex = Math.max(...Array.from(visibleIndicesRef.current), 0);
    
    if (maxVisibleIndex >= boundaryIndex - 4 && boundaryIndex < videoIds.length - 1) {
      setShowLoadingBoundary(true);
    } else if (boundaryIndex > maxVisibleIndex + 6) {
      setShowLoadingBoundary(false);
    }
  }, [readySet, videoIds, getReadyBoundaryIndex]);

  // Stable callback ref for onFirstFrameReady to prevent re-render cascades
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

  // Loading skeleton
  if (isLoading && shorts.length === 0) {
    return (
      <div className="pt-1 pb-4">
        <div className="grid grid-cols-2 gap-[2px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
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
    <div className="pt-1 pb-4">
      {/* 2-column grid with 2px gap */}
      <div className="grid grid-cols-2 gap-[2px]">
        {shorts.map((video, index) => {
          const shouldMount = mountableIndices.has(index);
          const streamId = uidFromNode({ src: video.media?.[0]?.media_url }) || video.id;
          const videoReady = isReady(streamId);
          
          return (
            <CardWrapper
              key={video.id}
              video={video}
              index={index}
              shouldMount={shouldMount}
              onTap={() => onVideoTap(video, index, shorts)}
              isAutoplayCandidate={isAutoplayPattern(index)}
              isVideoReady={videoReady}
              onFirstFrameReady={() => markReadyRef.current(streamId)}
              onVisibilityChange={handleVisibilityChange}
              onVideoRef={handleVideoRef}
            />
          );
        })}
      </div>
      
      {/* Loading boundary - shown when scrolling faster than videos can load */}
      <LoadingBoundary 
        isVisible={showLoadingBoundary} 
        variant="grid"
        message="Loading videos..."
      />

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-2">
        {isLoadingMore && (
          <div className="grid grid-cols-2 gap-[2px] w-full">
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="aspect-[3/4]" />
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
