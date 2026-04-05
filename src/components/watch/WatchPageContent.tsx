import React, { useState, useRef, useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import WatchHeader from '@/components/watch/WatchHeader';
import WatchGrid from '@/components/watch/WatchGrid';
import ShotOfTheWeek from '@/components/watch/ShotOfTheWeek';

import WatchSearchOverlay from '@/components/watch/WatchSearchOverlay';
import { useWatchFeed } from '@/components/watch/hooks/useWatchFeed';
import type { WatchFilter } from '@/components/watch/types';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';

interface WatchPageContentProps {
  embedded?: boolean;
  showShotOfWeek?: boolean;
  showSortFilter?: boolean;
  activeTag?: string;
}

const WatchPageContent: React.FC<WatchPageContentProps> = ({ embedded = false, showShotOfWeek = true, showSortFilter = true, activeTag }) => {
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
  } = useWatchFeed({ userId, filter: activeFilter, userLat, userLng });

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

      {showShotOfWeek && <ShotOfTheWeek userId={userId} />}

      {/* Echo — watch discovery */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <EchoContextualButton
          prompt="Based on golf courses I've reviewed and videos I might enjoy, what courses or content would you recommend I explore? I'm interested in great golf videos and course reviews."
          label="Ask Echo for recommendations"
          sublabel="Personalised course and video suggestions"
          dark={false}
          compact
          source="discover_watch_tab"
        />
      </div>

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
