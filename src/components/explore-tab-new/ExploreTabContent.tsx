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

      {/* Echo — course discovery */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <EchoContextualButton
          prompt="Help me find my next golf course to play. Ask me a few questions about my preferences — type of course, location, handicap, budget — and suggest some great options."
          label="Ask Echo to find you a course"
          sublabel="Describe your ideal round and Echo will suggest"
          dark={false}
          compact
          source="discover_explore_tab"
        />
      </div>

      <ExploreGrid
        posts={posts}
        coursePosts={coursePosts}
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

      <ExploreAutoplay posts={coursePosts} gridRef={gridRef} />

      <ExploreSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        userId={userId}
      />
    </div>
  );
}
