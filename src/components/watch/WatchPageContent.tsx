import React, { useState, useRef, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WatchHeader from '@/components/watch/WatchHeader';
import WatchGrid from '@/components/watch/WatchGrid';
import TrendingThisWeek from '@/components/watch/TrendingThisWeek';

import WatchAutoplay from '@/components/watch/WatchAutoplay';
import WatchSearchOverlay from '@/components/watch/WatchSearchOverlay';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import type { WatchFilter } from '@/components/watch/types';

interface WatchPageContentProps {
  embedded?: boolean;
  showSortFilter?: boolean;
  activeTag?: string;
  activeCategory?: string | null;
}

const WatchPageContent: React.FC<WatchPageContentProps> = ({ embedded = false, showSortFilter = true, activeTag, activeCategory }) => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const activeFilter: WatchFilter = activeTag === 'near' ? 'near' : 'trending';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  useEffect(() => {
    if (activeFilter !== 'near') return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {
        setUserLat(null);
        setUserLng(null);
      }
    );
  }, [activeFilter]);

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useWatchFeed({
    userId,
    filter: activeFilter,
    category: activeCategory ?? undefined,
    userLat,
    userLng,
  });

  return (
    <div className="bg-background min-h-screen">
      {showSortFilter && (
        <WatchHeader
          activeFilter={activeFilter}
          onFilterChange={() => {}}
          onOpenSearch={() => setIsSearchOpen(true)}
          embedded={embedded}
        />
      )}

      <TrendingThisWeek enabled={!!userId && activeTag === 'all'} />

      <WatchGrid
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        gridRef={gridRef as React.RefObject<HTMLDivElement>}
        userId={userId}
      />
      
      <WatchSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={userId}
      />
    </div>
  );
};

export default WatchPageContent;
