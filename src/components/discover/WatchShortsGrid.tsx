/**
 * WatchShortsGrid - Video grid for Watch tab
 * 
 * Features:
 * - 2-column grid layout
 * - 2px gap between items
 * - Infinite scroll with intersection observer
 * - Autoplay pattern: first + every 3rd (0, 3, 6, 9...)
 * - Loading skeletons
 * - Empty state
 * - Error state with retry
 */

import React, { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WatchShortCard } from './WatchShortCard';
import { WatchShort } from '@/hooks/useWatchShorts';

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
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-[2px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-xl" />
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
    <div className="px-4 py-4">
      {/* 2-column grid with 2px gap */}
      <div className="grid grid-cols-2 gap-[2px]">
        {shorts.map((video, index) => (
          <WatchShortCard
            key={video.id}
            video={video}
            index={index}
            onTap={() => onVideoTap(video, index, shorts)}
            isAutoplayCandidate={isAutoplayCandidate(index)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-2">
        {isLoadingMore && (
          <div className="grid grid-cols-2 gap-[2px] w-full">
            <Skeleton className="aspect-[9/16] rounded-xl" />
            <Skeleton className="aspect-[9/16] rounded-xl" />
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
