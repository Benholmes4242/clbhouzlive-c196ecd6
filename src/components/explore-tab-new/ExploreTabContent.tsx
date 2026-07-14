import { useCallback, useRef, useMemo, useState } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';

import { CircleActivityStrip } from './CircleActivityStrip';
import {
  AlmanacRegionTabs,
  FeatTierRail,
  AlmanacHead,
  REGION_TABS,
} from './AlmanacSections';
import { LegendaryFeatHero } from './LegendaryFeatHero';
import { useRegionFeats } from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';

import { SeasonStrip } from './SeasonStrip';
import { RankIdentityCard } from './RankIdentityCard';
import { CourseCrownsRail } from './CourseCrownsRail';
import { NextConquestsRail } from './NextConquestsRail';
import { ToughestCoursesRail } from './ToughestCoursesRail';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';

import ExploreGrid from './ExploreGrid';

import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { SPACE } from '@/lib/spacing';
import { useNavigate } from 'react-router-dom';

interface ExploreTabContentProps {
  embedded?: boolean;
}

const REGION_HUMAN: Record<string, string> = {
  worldwide: 'Worldwide',
  'uk-ireland': 'GB&I',
  usa: 'USA',
  'continental-europe': 'Europe',
  'rest-of-world': 'Rest of World',
};

function regionLabel(slug: string | null): string {
  return slug ? REGION_HUMAN[slug] ?? 'Region' : REGION_HUMAN.worldwide;
}

export default function ExploreTabContent({ embedded: _embedded = false }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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

  const regionUpper = regionLabel(activeRegion).toUpperCase();

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      {/* 1. Season strip */}
      <SeasonStrip />

      {/* 2. Rank identity card (dark) */}
      <RankIdentityCard userId={userId} />

      {/* 3. Friends rail (region-independent) */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <DiscoverSectionHeader eyebrow="Your friends" />
        <CircleActivityStrip userId={userId} />
      </div>

      {/* 4. Region tabs */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <AlmanacRegionTabs region={activeRegion} onRegionChange={handleRegionChange} />
      </div>

      {/* 5. Legendary hero (aces & albatrosses) */}
      <LegendarySection region={activeRegion} />

      {/* 6. Course Crowns */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <DiscoverSectionHeader
          eyebrow={`👑 Course Crowns · ${regionUpper}`}
          title="Two ways to own a course"
          linkLabel="All"
          onLinkClick={() => navigate('/courses')}
        />
        <CourseCrownsRail region={activeRegion} />
      </div>

      {/* 7. Next Conquests (silent when signed out / no WHS / no titles) */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <DiscoverSectionHeader
          eyebrow="Your next conquests"
          title="Records within reach"
        />
        <NextConquestsRail userId={userId} />
      </div>

      {/* 8. Eagles rail (restyled compact variant) */}
      <FeatTierRail
        region={activeRegion}
        tier="eagles"
        title={`Eagles · ${regionUpper}`}
        variant="compact"
      />

      {/* 9. Toughest courses (light) */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <DiscoverSectionHeader
          eyebrow="Toughest courses"
          title="Where scores go to die"
        />
        <ToughestCoursesRail />
      </div>

      {/* 10. Birdie hauls (light leaderboard) */}
      <FeatTierRail
        region={activeRegion}
        tier="birdie_hauls"
        title={`Birdie hauls · ${regionUpper}`}
        variant="list"
      />

      {/* 11. Feed block */}
      <div
        style={{
          marginTop: SPACE.sectionSection,
          borderTop: '1px solid rgba(15,23,42,0.06)',
          paddingTop: SPACE.sectionSection,
          paddingBottom: SPACE.pageBottom,
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
  const rows = data ?? [];
  const hasAny = rows.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!isLoading && !hasAny) return null;
  const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  const hasOverflow = rows.length > 12;
  return (
    <section style={{ fontFamily: FONT, paddingTop: SPACE.sectionSection }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: `0 ${SPACE.pagePadX}px ${SPACE.sectionHeaderContent}px` }}>
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
        <span style={{ flex: 1 }} />
        {hasOverflow && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#F7931E',
              cursor: 'pointer',
            }}
          >
            ALL
          </button>
        )}
      </div>
      <LegendaryFeatHero region={region} />
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
      />
    </section>
  );
}
