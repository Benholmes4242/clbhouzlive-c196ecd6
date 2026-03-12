import { useState, useCallback, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegionChips } from './hooks/useExploreRegionChips';
import { ExploreHeader } from './ExploreHeader';
import ExploreGrid from './ExploreGrid';
import ExploreAutoplay from './ExploreAutoplay';
import { ExploreSearchOverlay } from './ExploreSearchOverlay';

interface ExploreTabContentProps {
  embedded?: boolean;
}

export default function ExploreTabContent({ embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;

  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

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

  const coursePosts = useMemo(() => {
    return posts.filter(post => !!(post.courseName || post.review?.courseName));
  }, [posts]);

  const handleRegionChange = useCallback((slug: string | null) => {
    setActiveRegion(slug);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetSeen]);

  const handleOpenSearch = useCallback(() => {
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
        gridRef={gridRef}
        activeRegion={activeRegion}
        onRegionChange={handleRegionChange}
      />

      <ExploreAutoplay posts={posts} gridRef={gridRef} />

      <ExploreSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={userId}
      />
    </div>
  );
}
