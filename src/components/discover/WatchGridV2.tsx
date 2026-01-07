import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActivityGridV2 } from '@/components/profile/activity/v2';
import { useWatchPostsV2 } from './useWatchPostsV2';
import { UnifiedMediaItem } from '@/components/shared/grid/types';

interface WatchGridV2Props {
  onMediaClick?: (item: UnifiedMediaItem, index: number) => void;
}

/**
 * Watch page grid - reuses ActivityGridV2 with Watch-specific data
 * Shows videos from all users under 4 minutes (both portrait and landscape)
 * 
 * Layout: PP → L pattern (2 portraits, then 1 landscape)
 * Autoplay: 60% visible to start, 20% to pause
 * Infinite scroll: 24 items per page
 */
export function WatchGridV2({ onMediaClick }: WatchGridV2Props) {
  const navigate = useNavigate();
  
  const {
    items,
    isLoading,
    isError,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
  } = useWatchPostsV2();

  // Default click handler navigates to shorts player
  const handleItemClick = useCallback((item: UnifiedMediaItem, index: number) => {
    if (onMediaClick) {
      onMediaClick(item, index);
    } else {
      // Default: navigate to shorts player at this index
      navigate(`/shorts/${item.postId}`);
    }
  }, [onMediaClick, navigate]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">Something went wrong</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          {error?.message || 'Failed to load videos'}
        </p>
      </div>
    );
  }

  return (
    <>
      <ActivityGridV2
        items={items}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasMore={hasMore}
        onLoadMore={fetchNextPage}
        onItemClick={handleItemClick}
        config={{
          autoplayEnabled: true,
          playThreshold: 0.6,
          pauseThreshold: 0.2,
          showLikes: false,
          showCreator: true,
        }}
      />
      
      {/* All caught up message */}
      {!hasMore && items.length > 0 && !isLoading && !isFetchingNextPage && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </>
  );
}

export default WatchGridV2;
