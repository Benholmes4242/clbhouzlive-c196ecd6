import { useCallback, useRef, useMemo, useState } from 'react';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useExploreFeed } from './hooks/useExploreFeed';
import { useExploreRegion } from './hooks/useExploreRegion';

// WireTicker is now attached directly under the Discover hero by
// CoursesContent (`<AmateurCircuitHero fallback={…} /> + <WireTicker />`),
// so this surface no longer owns the ticker.


import { AlmanacLens, REGION_TABS } from './AlmanacSections';
import { type FeatRow, type RecordsMode } from './hooks/useRegionFeats';

import { scrollPageToTop } from '@/lib/getScrollParent';


import { TheRecordBook } from './TheRecordBook';
import { FriendsRoundsSection } from './FriendsRoundsSection';

import { FeatsSection } from './FeatsSection';
import { ToughestIndex } from './ToughestIndex';
import { HardestHolesRail } from './HardestHolesRail';
import { YourGameBlock } from './YourGameBlock';
import { SectionHead } from './SectionHead';

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

        <YourGameBlock userId={userId} region={activeRegion} />
        <FriendsRoundsSection userId={userId} opener={opener} />

        <TheRecordBook region={activeRegion} opener={opener} mode={scope} userId={userId} />

        {/* Attack / Defend band — absorbs "Your next conquests" */}
        <AttackDefendBand userId={userId} region={activeRegion} />


        {/* This week in golf — honours rail */}
        <WeekInGolfRail region={activeRegion} />


        {/* Season race */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <SeasonRaceCard userId={userId} />
        </div>

        {/* Feats of the game — merged Moments / Eagles / Birdie hauls */}
        <FeatsSection
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

        {/* Your nemesis holes — signed-in + WHS gated; filters by course_country */}



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
