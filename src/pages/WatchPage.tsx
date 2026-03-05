import React, { useState, useCallback } from 'react';
import { WatchHeader } from '@/components/watch/WatchHeader';
import { WatchGrid, NearMeEmptyState } from '@/components/watch/WatchGrid';
import { WatchSearchOverlay } from '@/components/watch/WatchSearchOverlay';
import { useWatchShorts, type WatchFilter } from '@/components/watch/hooks/useWatchShorts';
import { useAuth } from '@/hooks/useAuth';
import { PullToRefresh } from '@/components/PullToRefresh';
import type { FeedPost } from '@/components/media-system/types/media';

export default function WatchPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<WatchFilter>('trending');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const {
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useWatchShorts({
    userId: user?.id,
    filter: activeFilter,
  });

  const handleFilterChange = useCallback((filter: WatchFilter) => {
    setActiveFilter(filter);
    resetSeen();
  }, [resetSeen]);

  const handleTileTap = useCallback((post: FeedPost, index: number) => {
    // TODO: Open fullscreen player with post data
    console.log('[WatchPage] Tile tapped:', { postId: post.id, index, caption: post.caption?.slice(0, 50) });
  }, []);

  const handleRefresh = useCallback(async () => {
    resetSeen();
    await refetch();
  }, [resetSeen, refetch]);

  const emptyState = activeFilter === 'near' ? <NearMeEmptyState /> : undefined;

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: '#0A0A0A' }}
    >
      <WatchHeader
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onSearchTap={() => setIsSearchOpen(true)}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onTileTap={handleTileTap}
          emptyState={emptyState}
        />
      </PullToRefresh>

      <WatchSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={user?.id}
        onTileTap={handleTileTap}
      />
    </div>
  );
}
