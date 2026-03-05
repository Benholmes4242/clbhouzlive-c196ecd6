import React, { useState, useRef } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WatchHeader from '@/components/watch/WatchHeader';
import WatchGrid from '@/components/watch/WatchGrid';
import WatchAutoplay from '@/components/watch/WatchAutoplay';
import WatchSearchOverlay from '@/components/watch/WatchSearchOverlay';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import type { WatchFilter } from '@/components/watch/types';

const WatchPage: React.FC = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeFilter, setActiveFilter] = useState<WatchFilter>('trending');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetSeen,
    refetch,
  } = useWatchFeed({ userId, filter: activeFilter });

  const handleFilterChange = (f: WatchFilter) => {
    setActiveFilter(f);
    resetSeen();
  };

  return (
    <PageRoot hasBottomNav>
      <div className="bg-[var(--bg-page)] min-h-screen">
        <WatchHeader
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
        />
        <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
        <WatchSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          userId={userId}
        />
      </div>
    </PageRoot>
  );
};

export default WatchPage;
