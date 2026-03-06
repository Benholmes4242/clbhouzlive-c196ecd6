import { useState, useCallback, useRef } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegionChips } from './hooks/useExploreRegionChips';
import { ExploreHeader } from './ExploreHeader';
import ExploreGrid from './ExploreGrid';

interface ExploreTabContentProps {
  embedded?: boolean;
}

export default function ExploreTabContent({ embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { regions, isLoading: regionsLoading } = useExploreRegionChips();

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useExploreFeed({ userId, region: activeRegion });

  const handleRegionChange = useCallback((slug: string | null) => {
    setActiveRegion(slug);
    resetSeen();
  }, [resetSeen]);

  const handleOpenSearch = useCallback(() => {
    // Phase 4: will open ExploreSearchOverlay
    setIsSearchOpen(true);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <ExploreHeader
        activeRegion={activeRegion}
        regions={regions}
        regionsLoading={regionsLoading}
        onRegionChange={handleRegionChange}
        onOpenSearch={handleOpenSearch}
        embedded={embedded}
      />

      <ExploreGrid
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
      />
    </div>
  );
}
