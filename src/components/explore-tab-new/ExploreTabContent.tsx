import { useCallback, useRef, useMemo, useState } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';

import { WireTicker } from './WireTicker';
import { LeadStory } from './LeadStory';

import {
  AlmanacLens,
  FeatTierRail,
  AlmanacHead,
  REGION_TABS,
  TIER_ICON,
} from './AlmanacSections';
import { FeatCard } from './FeatCard';

import { LegendaryFeatHero } from './LegendaryFeatHero';
import { LegendaryLeadersBoards } from './LegendaryLeadersBoards';
import { CountLeadersBoard, type CountLeaderRow } from './CountLeadersBoard';
import { useRegionFeats, useRegionEagleLeaders, type FeatRow, type RecordsMode } from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';
import { SC_EAGLE, SC_EAGLE_DARK } from '@/features/courses/components/holes/_constants';

import { scrollPageToTop } from '@/lib/getScrollParent';

import { SeasonStrip } from './SeasonStrip';
import { RankIdentityCard } from './RankIdentityCard';
import { TheRecordBook } from './TheRecordBook';

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
  shellTabs?: React.ReactNode;
}



export default function ExploreTabContent({ embedded: _embedded = false, shellTabs }: ExploreTabContentProps) {
  const { user } = useSupabaseSession();
  const userId = user?.id;
  const gridRef = useRef<HTMLDivElement | null>(null);
  // THE LENS — single page-level scope. Not persisted; defaults to 'latest' per visit.
  const [scope, setScope] = useState<RecordsMode>('latest');

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
      scrollPageToTop('smooth');
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
      {/* 1. WIRE TICKER — friends achievements as a one-line marquee at the very top */}
      <WireTicker userId={userId} />

      {/* SCOPE 1 — ends where the almanac begins; shell tabs sticky here */}
      <div>
        {shellTabs}

        {/* 2. Season strip */}
        <SeasonStrip />

        {/* 3. Rank identity strip (slim single-row Almanac variant) */}
        <RankIdentityCard userId={userId} variant="strip" />
      </div>

      {/* SCOPE 2 — spans the almanac + everything below; region chips sticky here */}
      <div>
        {/* pre-chips spacer (chips must be a direct child of SCOPE 2 for sticky bounds) */}
        <div style={{ height: SPACE.sectionSection }} aria-hidden />
        {/* 4. THE LENS — region + scope in one sticky bar */}
        <AlmanacLens
          region={activeRegion}
          onRegionChange={handleRegionChange}
          scope={scope}
          onScopeChange={setScope}
        />

        {/* 5. LEAD STORY — cinematic tile driven by the top record for scope/region */}
        <LeadStory region={activeRegion} regionUpper={regionUpper} mode={scope} />

        {/* 6. Empty-region editorial card (only when all four tiers are empty) */}
        <AlmanacEmptyCard region={activeRegion} />

        {/* 7. Course Crowns (course records) -- self-hiding, owns its header */}
        <CourseCrownsRail region={activeRegion} opener={opener} mode={scope} />


        {/* 7. Legendary hero (aces & albatrosses) */}
        <LegendarySection region={activeRegion} mode={scope} onRowTap={handleFeatRowTap} />

        {/* 8. Eagles section -- RECENT rail or ALL TIME Most Eagles board */}
        <EaglesSection
          region={activeRegion}
          regionUpper={regionUpper}
          mode={scope}
          onRowTap={handleFeatRowTap}
        />

        {/* 9. Birdie hauls -- FeatTierRail returns null when empty */}
        <FeatTierRail
          region={activeRegion}
          tier="birdie_hauls"
          title={`Birdie hauls · ${regionUpper}`}
          variant="list"
          mode={scope}
          onRowTap={handleFeatRowTap}
        />


        {/* 10. Toughest courses -- self-hiding, owns its header */}
        <ToughestCoursesRail />

        {/* 11. Next Conquests (records within reach) -- self-hiding, owns its header */}
        <NextConquestsRail userId={userId} />

        {/* 12. Feed block */}
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
  mode,
  onRowTap,
}: {
  region: string | null;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
}) {
  const { data, isLoading } = useRegionFeats(region, 'legendary');
  const rows = data ?? [];
  const hasAny = rows.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetInitialMode, setSheetInitialMode] = useState<RecordsMode>('latest');
  const [sheetInitialMetric, setSheetInitialMetric] = useState<'aces' | 'albatrosses'>('aces');
  if (!isLoading && !hasAny) return null;
  const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  const hasOverflow = mode === 'latest' && rows.length > 12;
  const openSheetLatest = () => {
    setSheetInitialMode('latest');
    setSheetInitialMetric('aces');
    setSheetOpen(true);
  };
  const openSheetLeaders = (metric: 'aces' | 'albatrosses') => {
    setSheetInitialMode('alltime');
    setSheetInitialMetric(metric);
    setSheetOpen(true);
  };
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
            onClick={openSheetLatest}
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
            View all
          </button>
        )}
      </div>
      {mode === 'latest' ? (
        <LegendaryFeatHero region={region} onRowTap={onRowTap} />
      ) : (
        <LegendaryLeadersBoards region={region} onViewAll={openSheetLeaders} />
      )}
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={sheetInitialMode}
        initialMetric={sheetInitialMetric}
      />
    </section>
  );
}



const EAGLE_BAR_GRADIENT = 'linear-gradient(90deg, #F7931E, #FBBC2E)';
const EAGLES_RAIL_CAP = 12;

function EaglesSection({
  region,
  regionUpper,
  mode,
  onRowTap,
}: {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap?: (row: FeatRow) => void;
}) {
  const { data: featsData, isLoading } = useRegionFeats(region, 'eagles', 'latest');
  const { data: leadersData } = useRegionEagleLeaders(region);
  const rows = featsData ?? [];
  const hasAny = rows.length > 0;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetInitialMode, setSheetInitialMode] = useState<RecordsMode>('latest');

  const leaderRows: CountLeaderRow[] = useMemo(
    () =>
      (leadersData ?? [])
        .filter((r) => (r.eagles ?? 0) > 0)
        .sort((a, b) => (b.eagles ?? 0) - (a.eagles ?? 0))
        .map((r) => ({
          user_id: r.user_id,
          holder_name: r.holder_name,
          holder_avatar: r.holder_avatar,
          count: r.eagles ?? 0,
        })),
    [leadersData],
  );

  if (!isLoading && !hasAny) return null;
  const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  const displayRows = rows.slice(0, EAGLES_RAIL_CAP);
  const hasOverflow = mode === 'latest' && rows.length > EAGLES_RAIL_CAP;

  const openSheet = (initialMode: RecordsMode) => {
    setSheetInitialMode(initialMode);
    setSheetOpen(true);
  };

  return (
    <section style={{ fontFamily: FONT, paddingTop: SPACE.sectionSection }}>
      <AlmanacHead
        title={`Eagles · ${regionUpper}`}
        icon={TIER_ICON.eagles}
        onSeeAll={hasOverflow ? () => openSheet('latest') : undefined}
      />

      {mode === 'latest' ? (
        <div
          className="flex gap-3 px-4 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: SPACE.sectionSection }}
        >
          {displayRows.map((row, i) => (
            <FeatCard
              key={`${row.score_id ?? row.course_id ?? i}-${i}`}
              row={row}
              tier="eagles"
              size="compact"
              onTap={onRowTap ? () => onRowTap(row) : undefined}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: `0 ${SPACE.pagePadX}px` }}>
          <CountLeadersBoard
            title="Most Eagles"
            accent={SC_EAGLE}
            barGradient={EAGLE_BAR_GRADIENT}
            rows={leaderRows}
            onViewAll={() => openSheet('alltime')}
          />
        </div>
      )}
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="eagles"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={sheetInitialMode}
      />
    </section>
  );
}


