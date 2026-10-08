import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useContentReactions } from '@/components/explore-tab-new/courseled/hooks/useContentReactions';
import { useStoryEngagement } from '@/features/stories/useStoryEngagement';
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import type { FeaturedRoundEngagement } from '@/features/explore-magazine/FeaturedRoundCard';
import { analyticsEvents } from '@/utils/analyticsEvents';

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
export function Band({ children }: { children: React.ReactNode }) {
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
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  /* THE ROUND'S OWN REACTION, keyed ('round', whs_score_id) — the same hook and
     key Explore uses, so this celebrate and one on the same round lower in the
     feed are one reaction. Never the post-like path: there may be no post. */
  const engagementIds = useMemo(() => (id ? [id] : []), [id]);
  const roundEngagement = useStoryEngagement('round', engagementIds);
  const reactions = useContentReactions(
    useMemo(() => (id ? [{ type: 'round' as const, id }] : []), [id]),
  );
  const r = featured.data;
  if (!r) return null;
  const engagement: FeaturedRoundEngagement | null = (() => {
    if (reactions.unavailable) return null;
    const scoreId = r.whs_score_id;
    const state = reactions.stateFor('round', scoreId);
    const likeAvailable = !!reactions.viewerId;
    return {
      kind: 'celebrate' as const,
      likeCount: state.count,
      liked: state.mine,
      likeAvailable,
      commentCount: roundEngagement.engagementFor(scoreId).commentCount,
      commentAvailable: true,
      reactionSubjectId: scoreId,
      ownerName: r.display_name?.trim().split(/\s+/)[0] || null,
      isOwnRound: r.user_id === viewerId,
      onToggleLike: likeAvailable ? () => {
        analyticsEvents.track('explore_round_like_toggled', { score_id: scoreId, liked: !state.mine, view: 'home', surface: 'hero' });
        reactions.toggle('round', scoreId);
      } : undefined,
      onOpenComments: () => {
        analyticsEvents.track('explore_round_comments_opened', { score_id: scoreId, view: 'home', surface: 'hero' });
        setCommentsOpen(true);
      },
    };
  })();
  return (
    <>
      {/* A framed hero is a framed object: inset like the rails' contents. */}
      <div style={{ padding: '0 12px', marginBottom: 8 }}>
        <FeaturedRoundCard
          round={r}
          viewerId={viewerId}
          shape={shapes?.get(r.whs_score_id) ?? null}
          medals={medals.isSuccess ? medals.medals?.get(r.whs_score_id) ?? null : undefined}
          engagement={engagement}
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
      {commentsOpen && (
        <CommentsSheetV2
          isOpen
          onClose={() => {
            setCommentsOpen(false);
            queryClient.invalidateQueries({ queryKey: ['story-engagement', 'round'], refetchType: 'all' });
          }}
          targetType="round"
          targetId={r.whs_score_id}
        />
      )}
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
