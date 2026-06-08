import { useCallback, useRef, useMemo } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreMood } from './hooks/useExploreMood';
import { useExploreRegion } from './hooks/useExploreRegion';
import { ExploreHero } from './ExploreHero';
import { ExploreRecommendations } from './ExploreRecommendations';
import ConnectHandicapCue from '@/components/courses/course-detail/ConnectHandicapCue';
import { ExplorePassport } from './ExplorePassport';
import { ExploreEchoCTA } from './ExploreEchoCTA';
import { ExploreDestinations } from './ExploreDestinations';
import { TestYourGame } from './TestYourGame';
import { WhereYoudRank } from './WhereYoudRank';

import ExploreGrid from './ExploreGrid';
import ExploreAutoplay from './ExploreAutoplay';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import { SLATE_50 } from '@/features/courses/_shared/tokens';

interface ExploreTabContentProps {
  embedded?: boolean;
}

export default function ExploreTabContent({ embedded: _embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const gridRef = useRef<HTMLDivElement | null>(null);

  // URL-backed filter state — also read by Discover.tsx for the shell row.
  const { mood } = useExploreMood();
  const { region: activeRegion, setRegion } = useExploreRegion();

  const {
    posts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useExploreFeed({ userId, region: activeRegion });

  const coursePosts = useMemo(() => {
    return posts.filter(post => !!(post.courseName || post.review?.courseName));
  }, [posts]);

  const handleRegionChange = useCallback((slug: string | null) => {
    setRegion(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setRegion]);

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      {/* Hero: flush, full-width, first child — mirrors OverviewHero */}
      <ExploreHero userId={userId} mood={mood} />

      {/* Connect cue — self-pads; trim its outer wrapper to no h-padding */}
      <div style={{ paddingTop: 12, paddingBottom: 4 }}>
        <ConnectHandicapCue variant="discover" />
      </div>

      {/* New order. Each section self-pads 16px (single inset, matches other tabs). */}
      {activeRegion === null && <WhereYoudRank userId={userId} />}
      {activeRegion === null && <TestYourGame />}

      <ExplorePassport userId={userId} />
      <ExploreRecommendations userId={userId} mood={mood} />

      <ExploreEchoCTA mood={mood} />
      <ExploreDestinations activeRegion={activeRegion} onRegionSelect={handleRegionChange} />

      <ExploreSectionHeader title="More to explore" icon={LayoutGrid} sub="The full course feed" />

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
    </div>
  );
}
