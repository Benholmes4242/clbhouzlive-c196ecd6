import { useCallback, useRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';

// WireTicker is now attached directly under the Discover hero by
// CoursesContent (`<AmateurCircuitHero fallback={…} /> + <WireTicker />`),
// so this surface no longer owns the ticker.


import { AlmanacLens, REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';

import { scrollPageToTop } from '@/lib/getScrollParent';


import { TheRecordBook } from './TheRecordBook';
import { FriendsRoundsSection } from './FriendsRoundsSection';

import { AcesAlbatrossesPodium } from './AcesAlbatrossesPodium';
import { EaglesLedger } from './EaglesLedger';
import { BirdieHaulsLedger } from './BirdieHaulsLedger';
import { ToughestIndex } from './ToughestIndex';
import { HardestHolesRail } from './HardestHolesRail';
import { SectionHead } from './SectionHead';
import { DiscoverCard } from './DiscoverCard';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { AlmanacEmptyCard } from './AlmanacEmptyCard';

import ExploreGrid from './ExploreGrid';
import WeekInGolfRail from './WeekInGolfRail';

import { SeasonRaceCard } from './SeasonRaceCard';
import { YourStandingStrip } from './YourStandingStrip';
import { AttackDefendBand } from './AttackDefendBand';


import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { SPACE } from '@/lib/spacing';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { regionScopePhrase } from './regionScope';
import { EmptyScopeCard } from './EmptyScopeCard';

interface ExploreTabContentProps {
  embedded?: boolean;
  shellTabs?: React.ReactNode;
}

export default function ExploreTabContent({ embedded: _embedded = false, shellTabs }: ExploreTabContentProps) {
  const { user, loading: authLoading } = useSupabaseSession();
  const userId = user?.id;
  const gridRef = useRef<HTMLDivElement | null>(null);
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
  const handleLeaderTap = useCallback(
    (uid: string) => opener.openProfile(uid),
    [opener],
  );

  return (
    <div style={{ background: SLATE_50, minHeight: '100vh' }}>
      <div>

        {shellTabs}
        {/* Your standing — merged identity + standing band (crowns / rank+progress / hcp) */}
        <YourStandingStrip userId={userId} />
      </div>

      <div>
        <AlmanacLens
          region={activeRegion}
          onRegionChange={handleRegionChange}
          scope={scope}
          onScopeChange={setScope}
        />

        <AlmanacEmptyCard region={activeRegion} />

        <FriendsRoundsSection userId={userId} opener={opener} />

        {/* Attack / Defend band — absorbs "Your next conquests" */}
        <AttackDefendBand userId={userId} region={activeRegion} />

        <DiscoverCard>
          <TheRecordBook region={activeRegion} opener={opener} mode={scope} userId={userId} inCard />
        </DiscoverCard>




        {/* This week in golf — honours rail */}
        <WeekInGolfRail region={activeRegion} />


        {/* Season race */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: SPACE.sectionSection }}>
          <SeasonRaceCard userId={userId} />
        </div>

        {/* Merged Moments: Honours / Eagles / Birdies */}
        <MomentsSection
          region={activeRegion}
          regionUpper={regionUpper}
          mode={scope}
          onRowTap={handleFeatRowTap}
          onLeaderTap={handleLeaderTap}
        />

        {/* Toughest courses index */}
        <ToughestIndex region={activeRegion} />

        {/* Hardest holes rail — siblings to the sternest tests: courses then holes */}
        <HardestHolesRail region={activeRegion} />

        {/* Feed block */}
        <div
          style={{
            marginTop: SPACE.sectionSection,
            borderTop: '1px solid rgba(15,23,42,0.06)',
            paddingTop: SPACE.sectionSection,
            paddingBottom: SPACE.pageBottom,
          }}
        >
          <SectionHead
            overline="The feed"
            title="On the course"
            paddingX={30}
          />


          <ExploreGrid
            posts={posts}
            coursePosts={coursePosts}
            isLoading={isLoading || (authLoading && coursePosts.length === 0)}
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
  regionUpper,
  mode,
  onRowTap,
  onLeaderTap,
  hideHeader = false,
  sheetOpen: sheetOpenProp,
  onSheetOpenChange,
}: {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap: (row: FeatRow) => void;
  onLeaderTap: (uid: string) => void;
  hideHeader?: boolean;
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}) {
  const { data } = useRegionFeats(region, 'legendary');
  const rows = useMemo(() => data ?? [], [data]);
  const [localSheetOpen, setLocalSheetOpen] = useState(false);
  const controlled = onSheetOpenChange !== undefined;
  const sheetOpen = controlled ? !!sheetOpenProp : localSheetOpen;
  const setSheetOpen = controlled ? onSheetOpenChange : setLocalSheetOpen;
  const sectionMarginTop = hideHeader ? 0 : 32;
  const [sheetMetric, setSheetMetric] = useState<'aces' | 'albatrosses'>('aces');

  const openSheet = (metric: 'aces' | 'albatrosses') => {
    setSheetMetric(metric);
    setSheetOpen(true);
  };

  const overline = mode === 'alltime' ? 'All-time honours' : 'Latest honours';

  // Scoped-empty: render the unconquered empty-state.
  if ((data ?? []).length > 0 && rows.length === 0 && region != null) {
    return (
      <section style={{ marginTop: sectionMarginTop }}>
        {hideHeader ? null : (
          <SectionHead overline={overline} title="Moments of the game" paddingX={14} />
        )}
        <EmptyScopeCard
          title={`No moments ${regionScopePhrase(region)} yet.`}
          subline="This region is unconquered — be the first."
        />
      </section>
    );
  }

  // Suppress region-only used prop lint
  void regionUpper;

  return (
    <section style={{ marginTop: sectionMarginTop }}>
      {hideHeader ? null : (
        <SectionHead
          overline={overline}
          title="Moments of the game"
          meta="View all"
          onMeta={() => openSheet(sheetMetric)}
          paddingX={14}
        />
      )}

      {mode === 'alltime' && (
        <div
          role="tablist"
          aria-label="Metric"
          style={{
            margin: `${hideHeader ? 4 : 0}px 14px 8px`,
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: '#FFFFFF',
            border: '1px solid rgba(15,23,42,0.08)',
            borderRadius: 999,
          }}
        >
          {([
            { v: 'aces', label: 'Aces' },
            { v: 'albatrosses', label: 'Albatrosses' },
          ] as const).map((o) => {
            const active = sheetMetric === o.v;
            return (
              <button
                key={o.v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSheetMetric(o.v)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: active ? '#15171F' : 'transparent',
                  color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                  border: 'none',
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      <AcesAlbatrossesPodium
        region={region}
        mode={mode}
        metric={sheetMetric}
        onRowTap={onLeaderTap}
        onLatestRowTap={onRowTap}
      />
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode={mode}
        initialMetric={sheetMetric}
      />
    </section>
  );
}

type MomentsTab = 'honours' | 'eagles' | 'birdies';

/**
 * Merged "Moments of the game" — Honours / Eagles / Birdies behind one header.
 * Both page toggles (mode = Recent/All-time, region) are threaded into every
 * tab body; the selected tab is component-local and never resets on toggle.
 */
function MomentsSection({
  region,
  regionUpper,
  mode,
  onRowTap,
  onLeaderTap,
}: {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap: (row: FeatRow) => void;
  onLeaderTap: (uid: string) => void;
}) {
  const { t } = useTranslation('courses');
  const [tab, setTab] = useState<MomentsTab>('honours');
  const [sheetOpen, setSheetOpen] = useState(false);

  const tabs: { id: MomentsTab; label: string }[] = [
    { id: 'honours', label: t('discover.moments.tabs.honours', 'Honours') },
    { id: 'eagles', label: t('discover.moments.tabs.eagles', 'Eagles') },
    { id: 'birdies', label: t('discover.moments.tabs.birdies', 'Birdies') },
  ];

  const handleTab = (id: MomentsTab) => {
    if (id === tab) return;
    setTab(id);
    analyticsEvents.track('discover_feats_tab', { tier: id, mode });
  };

  return (
    <DiscoverCard>
      <SectionHead
        overline={
          mode === 'alltime'
            ? t('discover.moments.overlineAllTime', 'All-time honours')
            : t('discover.moments.overlineLatest', 'Latest honours')
        }
        title={t('discover.moments.title', 'Moments of the game')}
        meta={t('discover.moments.viewAll', 'View all')}
        onMeta={() => setSheetOpen(true)}
        paddingX={14}
        paddingTop={12}
        paddingBottom={10}
      />

      <div
        role="tablist"
        aria-label={t('discover.moments.title', 'Moments of the game')}
        style={{
          margin: '0 14px 4px',
          display: 'inline-flex',
          gap: 2,
          padding: 2,
          background: '#FFFFFF',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 999,
        }}
      >
        {tabs.map((o) => {
          const active = tab === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTab(o.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: active ? '#15171F' : 'transparent',
                color: active ? '#FFFFFF' : 'rgba(15,23,42,0.55)',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.2,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <div style={{ paddingBottom: 4 }}>
        {tab === 'honours' ? (
          <LegendarySection
            region={region}
            regionUpper={regionUpper}
            mode={mode}
            onRowTap={onRowTap}
            onLeaderTap={onLeaderTap}
            hideHeader
            sheetOpen={sheetOpen}
            onSheetOpenChange={setSheetOpen}
          />
        ) : null}
        {tab === 'eagles' ? (
          <EaglesLedger
            region={region}
            regionUpper={regionUpper}
            mode={mode}
            onRowTap={onRowTap}
            onLeaderTap={onLeaderTap}
            hideHeader
            sheetOpen={sheetOpen}
            onSheetOpenChange={setSheetOpen}
          />
        ) : null}
        {tab === 'birdies' ? (
          <BirdieHaulsLedger
            region={region}
            regionUpper={regionUpper}
            mode={mode}
            onRowTap={onRowTap}
            hideHeader
            sheetOpen={sheetOpen}
            onSheetOpenChange={setSheetOpen}
          />
        ) : null}
      </div>
    </DiscoverCard>
  );
}
