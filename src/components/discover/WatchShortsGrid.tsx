/**
 * WatchShortsGrid - Video grid for Watch tab with LAZY VIDEO MOUNTING
 * 
 * Features:
 * - 2-column grid layout
 * - 2px gap between items
 * - Infinite scroll with intersection observer
 * - LAZY MOUNTING: Only mounts HLSPlayer for visible + buffer items
 * - Autoplay pattern: first + every 3rd (0, 3, 6, 9...)
 * - Loading skeletons
 * - Empty state
 * - Error state with retry
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
  const videoIds = useMemo(() => shorts.map(s => s.id), [shorts]);
  
  // Initialize prefetch when videos change
  useEffect(() => {
    if (videoIds.length > 0) {
      initiatePrefetch(videoIds, 0);
    }
  }, [videoIds, initiatePrefetch]);
  
  // Track which items are currently visible
  const visibleIndicesRef = useRef(new Set<number>());
  const [mountableIndices, setMountableIndices] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4, 5]));
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoadingMore, onLoadMore]);

  // Debounced update of mountable indices
  const updateMountableIndices = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      const indices = new Set<number>();
      
      // Add all visible indices plus buffer
      visibleIndicesRef.current.forEach(idx => {
        // Add the visible item
        indices.add(idx);
        
        // Add buffer items before and after
        for (let i = 1; i <= MOUNT_BUFFER; i++) {
          if (idx - i >= 0) indices.add(idx - i);
          if (idx + i < shorts.length) indices.add(idx + i);
        }
      });
      
      // If nothing visible yet, mount first few items
      if (indices.size === 0) {
        for (let i = 0; i < Math.min(6, shorts.length); i++) {
          indices.add(i);
        }
      }
      
      setMountableIndices(indices);
    }, 100); // 100ms debounce
  }, [shorts.length]);

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
    } else {
      visibleIndicesRef.current.delete(index);
    }
    updateMountableIndices();
    
    // Update boundary visibility based on scroll position
    const boundaryIndex = getReadyBoundaryIndex(videoIds);
    const maxVisibleIndex = Math.max(...Array.from(visibleIndicesRef.current), 0);
    
    // Show boundary if user is approaching non-ready content
    if (maxVisibleIndex >= boundaryIndex - 4 && boundaryIndex < videoIds.length - 1) {
      setShowLoadingBoundary(true);
    } else if (boundaryIndex > maxVisibleIndex + 6) {
      // Hide boundary when content becomes ready ahead of view
      setShowLoadingBoundary(false);
    }
  }, [updateMountableIndices, getReadyBoundaryIndex, videoIds]);
  
  // Hide boundary when videos become ready
  useEffect(() => {
    const boundaryIndex = getReadyBoundaryIndex(videoIds);
    const maxVisibleIndex = Math.max(...Array.from(visibleIndicesRef.current), 0);
    
    if (showLoadingBoundary && boundaryIndex > maxVisibleIndex + 6) {
      setShowLoadingBoundary(false);
    }
  }, [readySet, videoIds, getReadyBoundaryIndex, showLoadingBoundary]);

  // Create individual card visibility observers
  const CardWrapper = useMemo(() => {
    return React.memo(function CardWrapperInner({ 
      video, 
      index, 
      shouldMount,
      onTap,
      isAutoplayCandidate,
      onFirstFrameReady,
    }: { 
      video: WatchShort; 
      index: number; 
      shouldMount: boolean;
      onTap: () => void;
      isAutoplayCandidate: boolean;
      onFirstFrameReady: () => void;
    }) {
      const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: false,
      });

      // Report visibility changes to parent
      useEffect(() => {
        handleVisibilityChange(index, inView);
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
            onFirstFrameReady={onFirstFrameReady}
          />
        </div>
      );
    });
  }, [handleVisibilityChange]);

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
      <div className="py-4">
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

  // Calculate which indices should autoplay (first + every 3rd)
  const isAutoplayCandidate = (index: number) => index === 0 || index % 3 === 0;

  return (
    <div className="py-4">
      {/* 2-column grid with 2px gap */}
      <div className="grid grid-cols-2 gap-[2px]">
        {shorts.map((video, index) => {
          const shouldMount = mountableIndices.has(index);
          
          return (
            <CardWrapper
              key={video.id}
              video={video}
              index={index}
              shouldMount={shouldMount}
              onTap={() => onVideoTap(video, index, shorts)}
              isAutoplayCandidate={isAutoplayCandidate(index)}
              onFirstFrameReady={() => markReady(video.id)}
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
