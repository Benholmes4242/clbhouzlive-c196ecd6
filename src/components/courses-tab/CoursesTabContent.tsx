import { useState, useCallback, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from '@/components/explore-tab-new/hooks/useExploreFeed';
import { useExploreRegionChips } from '@/components/explore-tab-new/hooks/useExploreRegionChips';
import { ExploreHeader } from '@/components/explore-tab-new/ExploreHeader';
import ExploreGrid from '@/components/explore-tab-new/ExploreGrid';
import ExploreAutoplay from '@/components/explore-tab-new/ExploreAutoplay';
import { ExploreSearchOverlay } from '@/components/explore-tab-new/ExploreSearchOverlay';
import { EchoContextualButton } from '@/components/echo/EchoContextualButton';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { FeaturedCoursesCarousel } from './FeaturedCoursesCarousel';
import { BucketListStrip } from './BucketListStrip';
import { BestRoundsStrip } from './BestRoundsStrip';

interface CoursesTabContentProps {
  embedded?: boolean;
}

export default function CoursesTabContent({ embedded = false }: CoursesTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const { regions, isLoading: regionsLoading } = useExploreRegionChips();
  const { posts, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, resetSeen } = useExploreFeed({ userId, region: activeRegion });

  const coursePosts = useMemo(() => posts.filter(p => !!(p.courseName || p.review?.courseName)), [posts]);

  const handleRegionChange = useCallback((slug: string | null) => {
    setActiveRegion(slug);
    resetSeen();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [resetSeen]);

  return (
    <div className="bg-background min-h-screen">
      {/* A: Region filter chips + search (existing ExploreHeader) */}
      <ExploreHeader
        activeRegion={activeRegion}
        regions={regions}
        regionsLoading={regionsLoading}
        onRegionChange={handleRegionChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        embedded={embedded}
      />

      {/* B: Featured hero carousel — only when no region filter active */}
      {activeRegion === null && <div className="pt-3"><FeaturedCoursesCarousel onRegionSelect={handleRegionChange} /></div>}

      {/* C: Echo CTA */}
      <div style={{ padding: '8px 12px 14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <EchoContextualButton
          prompt="Help me find my next golf course to play. Ask me a few questions about my preferences — type of course, location, handicap, budget — and suggest some great options."
          label="Ask Echo to find you a course"
          sublabel="Describe your ideal round and Echo will suggest"
          dark={false}
          compact
          source="discover_courses_tab"
        />
      </div>

      {/* D: Bucket list — only when no region filter */}
      {activeRegion === null && <BucketListStrip />}

      {/* E: Best rounds this week */}
      <BestRoundsStrip activeRegion={activeRegion} />

      {/* F + G: Trending + full grid (existing) */}
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
      <ScrollToTopGlass />
    </div>
  );
}
