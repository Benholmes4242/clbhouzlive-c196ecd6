import React, { useState, useRef, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WatchHeader from '@/components/watch/WatchHeader';
import WatchGrid from '@/components/watch/WatchGrid';
import WatchAutoplay from '@/components/watch/WatchAutoplay';
import WatchSearchOverlay from '@/components/watch/WatchSearchOverlay';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import type { WatchFilter } from '@/components/watch/types';

const dbg = (tag: string, ...args: any[]) => {
  console.log(`[${tag}] ${Date.now() % 100000}`, ...args);
};

const WatchPage: React.FC = () => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;
  const [activeFilter, setActiveFilter] = useState<WatchFilter>('trending');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dbg('W:PAGE', 'WatchPage mounted, userId:', userId);
  }, []);

  const {
    posts,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    resetSeen,
    refetch,
  } = useWatchFeed({ userId, filter: activeFilter });

  useEffect(() => {
    dbg('W:PAGE', 'Posts:', posts.length, 'isLoading:', isLoading, 'filter:', activeFilter);
  }, [posts.length, isLoading, activeFilter]);

  const handleFilterChange = (f: WatchFilter) => {
    dbg('W:PAGE', 'Filter changed to:', f);
    setActiveFilter(f);
    resetSeen();
  };

  return (
    <PageRoot hasBottomNav>
      <div className="bg-[var(--bg-page)] min-h-screen">
        <WatchHeader
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          onOpenSearch={() => {
            dbg('W:PAGE', 'Search overlay: OPEN');
            setIsSearchOpen(true);
          }}
        />
        <WatchGrid
          posts={posts}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          gridRef={gridRef as React.RefObject<HTMLDivElement>}
          userId={userId}
        />
        <WatchAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
        <WatchSearchOverlay
          isOpen={isSearchOpen}
          onClose={() => {
            dbg('W:PAGE', 'Search overlay: CLOSED');
            setIsSearchOpen(false);
          }}
          userId={userId}
        />
      </div>
    </PageRoot>
  );
};

export default WatchPage;
