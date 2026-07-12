import { useCallback, useRef, useMemo } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';
import ConnectHandicapCue from '@/components/courses/course-detail/ConnectHandicapCue';
import { CircleActivityStrip } from './CircleActivityStrip';
import { AlmanacRegionTabs, FeatTierRail, AlmanacHead, REGION_TABS } from './AlmanacSections';

import ExploreGrid from './ExploreGrid';

import { SLATE_50 } from '@/features/courses/_shared/tokens';

interface ExploreTabContentProps {
  embedded?: boolean;
}

export default function ExploreTabContent({ embedded: _embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const gridRef = useRef<HTMLDivElement | null>(null);

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

  const coursePosts = useMemo(
    () => posts.filter((post) => !!(post.courseName || post.review?.courseName)),
    [posts],
  );

  const feedRegionLabel = useMemo(
    () => REGION_TABS.find((tab) => tab.slug === activeRegion)?.label ?? 'Worldwide',
    [activeRegion],
  );

  const handleRegionChange = useCallback(
    (slug: string | null) => {
      setRegion(slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setRegion],
  );

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      <div style={{ paddingTop: 0, paddingBottom: 16 }}>
        <ConnectHandicapCue variant="discover" />
      </div>

      {/* Friends rail — region-INDEPENDENT, always visible */}
      <CircleActivityStrip userId={userId} />

      {/* Zone seam: friends → register tabs */}
      <div
        style={{
          marginTop: 16,
          borderTop: '1px solid rgba(15,23,42,0.06)',
          paddingTop: 16,
        }}
      />

      {/* Region tabs — shared control driving tiers and grid */}
      <AlmanacRegionTabs region={activeRegion} onRegionChange={handleRegionChange} />

      {/* The four tiers */}
      <FeatTierRail region={activeRegion} tier="legendary" title="Aces & Albatrosses" />
      <FeatTierRail region={activeRegion} tier="records" title="Course records" />
      <FeatTierRail region={activeRegion} tier="eagles" title="Eagles" />
      <FeatTierRail region={activeRegion} tier="birdie_hauls" title="Birdie hauls" />

      <div
        style={{
          marginTop: 16,
          borderTop: '1px solid rgba(15,23,42,0.06)',
          paddingTop: 16,
        }}
      >
        <AlmanacHead icon="📍" title={`The feed · ${feedRegionLabel}`} />
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
    </div>
  );
}
