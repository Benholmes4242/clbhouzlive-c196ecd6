import { useCallback, useRef, useMemo, useState } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';

import { WireTicker } from './WireTicker';
import { LeadStory } from './LeadStory';

import { AlmanacLens, REGION_TABS } from './AlmanacSections';
import {
  useRegionFeats,
  type FeatRow,
  type RecordsMode,
} from './hooks/useRegionFeats';
import { TierSeeAllSheet } from './TierSeeAllSheet';

import { scrollPageToTop } from '@/lib/getScrollParent';

import { SeasonStrip } from './SeasonStrip';
import { RankIdentityCard } from './RankIdentityCard';
import { TheRecordBook } from './TheRecordBook';

import { AcesAlbatrossesPodium } from './AcesAlbatrossesPodium';
import { EaglesLedger } from './EaglesLedger';
import { BirdieHaulsLedger } from './BirdieHaulsLedger';
import { ToughestIndex } from './ToughestIndex';
import { SectionHead } from './SectionHead';

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
      <WireTicker userId={userId} />

      <div>
        {shellTabs}
        <SeasonStrip />
        <RankIdentityCard userId={userId} variant="strip" />
      </div>

      <div>
        <div style={{ height: SPACE.sectionSection }} aria-hidden />
        <AlmanacLens
          region={activeRegion}
          onRegionChange={handleRegionChange}
          scope={scope}
          onScopeChange={setScope}
        />

        <LeadStory region={activeRegion} regionUpper={regionUpper} mode={scope} />

        <AlmanacEmptyCard region={activeRegion} />

        <TheRecordBook region={activeRegion} opener={opener} mode={scope} userId={userId} />

        {/* Feats: header + aces/albatrosses podium pair */}
        <LegendarySection
          region={activeRegion}
          regionUpper={regionUpper}
          mode={scope}
          onRowTap={handleFeatRowTap}
          onLeaderTap={handleLeaderTap}
        />


        {/* Eagles ledger card */}
        <EaglesLedger
          region={activeRegion}
          regionUpper={regionUpper}
          mode={scope}
          onRowTap={handleFeatRowTap}
          onLeaderTap={handleLeaderTap}
        />

        {/* Birdie hauls ledger card */}
        <BirdieHaulsLedger
          region={activeRegion}
          regionUpper={regionUpper}
          mode={scope}
          onRowTap={handleFeatRowTap}
        />

        {/* Toughest courses index */}
        <ToughestIndex />

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
          />


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
}: {
  region: string | null;
  regionUpper: string;
  mode: RecordsMode;
  onRowTap: (row: FeatRow) => void;
  onLeaderTap: (uid: string) => void;
}) {
  const { data } = useRegionFeats(region, 'legendary');
  const rows = data ?? [];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMetric, setSheetMetric] = useState<'aces' | 'albatrosses'>('aces');

  const openSheet = (metric: 'aces' | 'albatrosses') => {
    setSheetMetric(metric);
    setSheetOpen(true);
  };

  return (
    <section style={{ marginTop: 32 }}>
      <SectionHead
        overline={mode === 'alltime' ? 'All-time honours' : 'Latest honours'}
        title="Moments of the game"
      />


      <AcesAlbatrossesPodium
        region={region}
        onViewAll={openSheet}
        onRowTap={onLeaderTap}
      />
      <TierSeeAllSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tier="legendary"
        region={region}
        rows={rows}
        onRowTap={onRowTap}
        initialMode="alltime"
        initialMetric={sheetMetric}
      />
    </section>
  );
}
