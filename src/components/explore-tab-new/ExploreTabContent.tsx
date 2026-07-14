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
import { useRegionFeats, type FeatRow } from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';

import { SeasonStrip } from './SeasonStrip';
import { RankIdentityCard } from './RankIdentityCard';
import { CourseCrownsRail } from './CourseCrownsRail';
import { NextConquestsRail } from './NextConquestsRail';
import { ToughestCoursesRail } from './ToughestCoursesRail';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { AlmanacEmptyCard } from './AlmanacEmptyCard';

import ExploreGrid from './ExploreGrid';

import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { SPACE } from '@/lib/spacing';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

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

  const regionUpper = feedRegionLabel.toUpperCase();

  const opener = useScorecardOpener();
  const handleFeatRowTap = useCallback(
    (row: FeatRow) => {
      if (row.score_id) opener.openByScore(row.score_id, null, row.user_id);
      else if (row.user_id) opener.openProfile(row.user_id);
    },
    [opener],
  );

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      {/* 1. Season strip */}
      <SeasonStrip />

      {/* 2. Rank identity card (dark) */}
      <RankIdentityCard userId={userId} />

      {/* 3. Friends rail (region-independent) — rail owns its header */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <CircleActivityStrip userId={userId} />
      </div>

      {/* 4. Region tabs */}
      <div style={{ marginTop: SPACE.sectionSection }}>
        <AlmanacRegionTabs region={activeRegion} onRegionChange={handleRegionChange} />
      </div>

      {/* 5. Empty-region editorial card (only when all four tiers are empty) */}
      <AlmanacEmptyCard region={activeRegion} />

      {/* 6. Legendary hero (aces & albatrosses) */}
      <LegendarySection region={activeRegion} onRowTap={handleFeatRowTap} />

      {/* 7. Course Crowns -- self-hiding, owns its header */}
      <CourseCrownsRail region={activeRegion} />

      {/* 8. Next Conquests -- self-hiding, owns its header */}
      <NextConquestsRail userId={userId} />

      {/* 9. Eagles rail -- FeatTierRail returns null when empty */}
      <FeatTierRail
        region={activeRegion}
        tier="eagles"
        title={`Eagles · ${regionUpper}`}
        variant="compact"
        onRowTap={handleFeatRowTap}
      />

      {/* 10. Toughest courses -- self-hiding, owns its header */}
      <ToughestCoursesRail />

      {/* 11. Birdie hauls -- FeatTierRail returns null when empty */}
      <FeatTierRail
        region={activeRegion}
        tier="birdie_hauls"
        title={`Birdie hauls · ${regionUpper}`}
        variant="list"
        onRowTap={handleFeatRowTap}
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

      {/* Single shared scorecard sheet for all feat/legendary/see-all rows */}
      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
}


function LegendarySection({
  region,
  onRowTap,
}: {
  region: string | null;
  onRowTap?: (row: FeatRow) => void;
}) {
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
      <LegendaryFeatHero region={region} onRowTap={onRowTap} />
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
      />
    </section>
  );
}

