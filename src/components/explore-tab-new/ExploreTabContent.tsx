import { useCallback, useRef, useMemo } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreMood } from './hooks/useExploreMood';
import { useExploreRegion } from './hooks/useExploreRegion';
import { ExploreHero } from './ExploreHero';
import { ExploreRecommendations } from './ExploreRecommendations';
import { ExplorePassport } from './ExplorePassport';
import { ExploreEchoCTA } from './ExploreEchoCTA';
import { ExploreDestinations } from './ExploreDestinations';
import { FeaturedCoursesCarousel } from './FeaturedCoursesCarousel';
import { BucketListStrip } from './BucketListStrip';
import { ReviewsOfTheWeekStrip } from './ReviewsOfTheWeekStrip';
import ExploreGrid from './ExploreGrid';
import ExploreAutoplay from './ExploreAutoplay';
import { ExploreSectionHeader } from './ExploreSectionHeader';

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
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <ExploreHero userId={userId} mood={mood} />
      <ExploreRecommendations userId={userId} mood={mood} />
      <ExplorePassport userId={userId} />
      <ExploreEchoCTA mood={mood} />
      <ExploreDestinations activeRegion={activeRegion} onRegionSelect={handleRegionChange} />

      {activeRegion === null && <FeaturedCoursesCarousel onRegionSelect={handleRegionChange} />}
      {activeRegion === null && <BucketListStrip />}
      <ReviewsOfTheWeekStrip activeRegion={activeRegion} />

      <ExploreSectionHeader title="More to explore" sub="The full course feed" />

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
