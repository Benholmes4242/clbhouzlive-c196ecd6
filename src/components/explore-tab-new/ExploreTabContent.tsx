import { useCallback, useRef, useMemo } from 'react';
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


import { CommunityShelf } from './CommunityShelf';
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
      <div style={{ marginLeft: -16, marginRight: -16 }}>
        <ExploreHero userId={userId} mood={mood} />
      </div>
      <ExplorePassport userId={userId} />
      <ExploreRecommendations userId={userId} mood={mood} />

      {activeRegion === null && <WhereYoudRank userId={userId} />}
      {activeRegion === null && <TestYourGame />}


      {/* Find your next round — Echo + Destinations as one intent block */}
      <ExploreEchoCTA mood={mood} />
      <ExploreDestinations activeRegion={activeRegion} onRegionSelect={handleRegionChange} />

      {/* Phase 2b — CommunityShelf (Bucket + Reviews merged under one header) */}
      <CommunityShelf activeRegion={activeRegion} />


      <ExploreSectionHeader title="More to explore" sub="The full course feed" />

      <div style={{ marginLeft: -16, marginRight: -16 }}>
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
      </div>

      <ExploreAutoplay posts={coursePosts} gridRef={gridRef} />
    </div>
  );
}
