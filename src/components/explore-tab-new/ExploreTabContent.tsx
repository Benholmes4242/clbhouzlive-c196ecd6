import { useCallback, useRef, useMemo } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';
import DiscoverWhsMasthead from './DiscoverWhsMasthead';
import { CircleActivityStrip } from './CircleActivityStrip';
import { AlmanacRegionTabs, FeatTierRail, AlmanacHead, REGION_TABS } from './AlmanacSections';
import { LegendaryFeatHero } from './LegendaryFeatHero';
import { WhereYoudRank } from './WhereYoudRank';
import { ToughestCoursesStrip } from './ToughestCoursesStrip';
import { useRegionFeats } from './hooks/useRegionFeats';

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
      <DiscoverWhsMasthead />

      {/* Friends rail — region-INDEPENDENT, always visible */}
      <CircleActivityStrip userId={userId} />

      {/* Spacer between friends rail and region tabs */}
      <div style={{ height: 16 }} />


      {/* Region tabs — shared control driving tiers and grid */}
      <AlmanacRegionTabs region={activeRegion} onRegionChange={handleRegionChange} />

      {/* Legendary hero (aces & albatrosses) */}
      <LegendarySection region={activeRegion} />

      <FeatTierRail region={activeRegion} tier="records" title="Course records" />
      <FeatTierRail region={activeRegion} tier="eagles" title="Eagles" variant="compact" />
      <FeatTierRail region={activeRegion} tier="birdie_hauls" title="Birdie hauls" variant="list" />


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

function LegendarySection({ region }: { region: string | null }) {
  const { data, isLoading } = useRegionFeats(region, 'legendary');
  const hasAny = (data?.length ?? 0) > 0;
  if (!isLoading && !hasAny) return null;
  const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  return (
    <section style={{ fontFamily: FONT, paddingTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 8px' }}>
        <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>⛳</span>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: '#8A6400',
          }}
        >
          Aces &amp; Albatrosses
        </span>
      </div>
      <LegendaryFeatHero region={region} />
    </section>
  );
}


