import { useMemo } from 'react';

import { FeaturedRoundCard } from '@/features/explore-magazine/FeaturedRoundCard';
import { WeeklyClubShelf } from '@/features/explore-magazine/WeeklyClubShelf';
import { ScoresStandingSlot } from '@/features/explore-magazine/ConnectStandingInvite';
import { useFeaturedRound } from '@/features/explore-magazine/useFeaturedRound';
import { useViewerScoreScope } from '@/features/explore-magazine/useViewerScoreScope';
import { useBatchRoundMedals } from '@/features/explore-magazine/useBatchRoundMedals';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

import { CANVAS } from './feedSurfaces';
import { LINE } from './FeedCard';
import type { HomeRailKind } from './homeRailCadence';

/**
 * Option A band: feed canvas, hairline top and bottom, full width. The rail
 * inside keeps its own inset. `empty:hidden` — a shelf that renders nothing
 * leaves no band and no gap.
 */
function Band({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="empty:hidden"
      style={{
        background: CANVAS,
        borderTop: `1px solid ${LINE}`,
        borderBottom: `1px solid ${LINE}`,
        padding: '17px 0 18px',
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function FeaturedRoundSlab({ viewerId }: { viewerId: string }) {
  const geo = useViewerScoreScope(viewerId).scope;
  const featured = useFeaturedRound(viewerId, 'world', {
    clubId: geo.primaryClubId,
    county: geo.county,
    country: geo.country,
  });
  const id = featured.data?.whs_score_id ?? null;
  const ids = useMemo(() => [id], [id]);
  const shapes = useRoundHoleShapes(ids);
  const medals = useBatchRoundMedals(ids);
  const opener = useScorecardOpener();
  const r = featured.data;
  if (!r) return null;
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <FeaturedRoundCard
          round={r}
          viewerId={viewerId}
          shape={shapes?.get(r.whs_score_id) ?? null}
          medals={medals.isSuccess ? medals.medals?.get(r.whs_score_id) ?? null : undefined}
          onOpen={() => opener.openByScore(r.whs_score_id, null, r.user_id)}
        />
      </div>
      <RoundDetailSheet
        open={!!opener.target}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        connectionId={opener.target?.connectionId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </>
  );
}

function ClubWeekBand({ viewerId, pos }: { viewerId: string; pos: number }) {
  const geo = useViewerScoreScope(viewerId);
  const { primaryClubId, primaryClubName } = geo.scope;
  if (!geo.isFetched || !primaryClubId) return null;
  return (
      <Band>
        <WeeklyClubShelf
          viewerId={viewerId}
          clubId={primaryClubId}
          clubName={primaryClubName}
          enabled
          pos={pos}
        />
      </Band>
  );
}

export function HomeRail({ kind, viewerId, pos }: { kind: HomeRailKind; viewerId: string | undefined; pos: number }) {
  if (!viewerId) return null;
  if (kind === 'featuredRound') return <FeaturedRoundSlab viewerId={viewerId} />;
  if (kind === 'clubWeek') return <ClubWeekBand viewerId={viewerId} pos={pos} />;
  return (
    <Band>
      <ScoresStandingSlot viewerId={viewerId} pos={pos} />
    </Band>
  );
}
