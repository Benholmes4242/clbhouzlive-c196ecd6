import React, { useState, useRef, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WatchHeader from '@/components/watch/WatchHeader';
import WatchGrid from '@/components/watch/WatchGrid';

import WatchSearchOverlay from '@/components/watch/WatchSearchOverlay';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import type { WatchFilter } from '@/components/watch/types';

interface WatchPageContentProps {
  embedded?: boolean;
}

const WatchPageContent: React.FC<WatchPageContentProps> = ({ embedded = false }) => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeFilter, setActiveFilter] = useState<WatchFilter>('trending');
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
  } = useWatchFeed({ userId, filter: activeFilter, userLat, userLng });

  const handleFilterChange = (f: WatchFilter) => {
    setActiveFilter(f);
    resetSeen();
  };

  return (
    <div className="bg-background min-h-screen">
      <WatchHeader
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        embedded={embedded}
      />
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
      <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
      <WatchSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={userId}
      />
    </div>
  );
};

export default WatchPageContent;