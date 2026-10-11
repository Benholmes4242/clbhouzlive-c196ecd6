/**
 * BRIEF_SCORES_FEATURED_ROUND — THE ONE ENLARGED ROUND.
 *
 * AchievementCallout's "a special round is MARKED, NEVER ENLARGED" still governs
 * the FEED. This hero is the one agreed exception (Ben), mounted only in the
 * slot above the All feed. No feed card changes. BRIEF_FEATURED_ROUND_FIXES:
 * the pane is the feed card's photographic treatment (course image_url, the
 * same RoundShape trace) plus a gold frame, a pill and a headline.
 *
 * GOLD, NEVER AMBER, ON THE FRAME. Gold means a rare achievement (eagle chips,
 * ace ring). Amber means the viewing member, so on the viewer's own round only
 * the NAME turns amber and reads "You".
 */
import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import type { RoundCourseContext } from '@/lib/whs/useRoundCourseContext';
import type { RoundMedalCounts } from './useBatchRoundMedals';
import { r as rad } from '@/lib/radius';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import type { FeaturedRound } from './useFeaturedRound';
import { Skeleton } from '@/components/ui/skeleton';
import { RoundPostCard, type RoundPostEngagement } from './RoundPostCard';

const PANE_H = 300;

export const FeaturedRoundCard: React.FC<{
  round: FeaturedRound;
  viewerId?: string;
  shape?: HoleShape | null;
  onOpen: () => void;
  engagement?: FeaturedRoundEngagement | null;
  /** The feed's batched award read; its `awards` name each chip. */
  medals?: RoundMedalCounts | null;
  /** The surface's batched course-context row (useBatchRoundCourseContext). */
  courseContext?: RoundCourseContext | null;
  /** Home only: square corners, edge to edge like its feed neighbours. */
  square?: boolean;
  /** Crown text. Absent = "Round of the week". */
  pillLabel?: string;
  /** Strokes received, when the caller holds it (gross of record minus net). */
  courseHandicap?: number | null;
  /** Member's public home club, when the caller holds it. */
  club?: string | null;
}> = ({ round: r, viewerId, shape = null, onOpen, engagement = null, medals, square = false, pillLabel, courseHandicap = null, club = null, courseContext = null }) => (
  /* ONE CARD, TWO STATES: the hero is the ordinary round post with the crown. */
  <RoundPostCard
    hero
    scoreId={r.whs_score_id}
    courseName={r.course_name}
    imageUrl={r.image_url}
    gross={r.gross}
    toPar={r.to_par}
    par={r.course_par}
    net={r.net_score}
    courseHandicap={courseHandicap}
    stableford={r.stableford ?? null}
    playDate={r.play_date || null}
    shape={shape}
    holesInOne={r.holes_in_one}
    cleanCard={r.clean_card}
    who={{ userId: r.user_id, name: r.display_name, photoUrl: r.photo_url, isViewer: !!viewerId && r.user_id === viewerId }}
    club={club}
    engagement={engagement}
    awards={medals?.awards ?? null}
    context={courseContext}
    onOpen={onOpen}
    square={square}
    crownLabel={pillLabel}
  />
);

export type FeaturedRoundEngagement = RoundPostEngagement;

/** Loading silhouette of the Round of the week card: the same rounded 300px
 *  photo pane, chip top-left, then figure, member, course and fact lines. */
export const FeaturedRoundSkeleton: React.FC = () => {
  const bar = (w: number | string, h: number, extra?: React.CSSProperties) => (
    <Skeleton style={{ width: w, height: h, borderRadius: 6, ...extra }} />
  );
  return (
    <div aria-hidden="true" style={{ position: 'relative', height: PANE_H, borderRadius: rad.lg, overflow: 'hidden', background: A.PANEL }}>
      <div style={{ position: 'absolute', top: 12, left: 12 }}>{bar(112, 22, { borderRadius: rad.pill })}</div>
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
        {bar(96, 44)}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
          {bar(30, 30, { borderRadius: '34%' })}
          {bar(140, 18)}
        </div>
        <div style={{ marginTop: 8 }}>{bar('60%', 13)}</div>
        <div style={{ marginTop: 6 }}>{bar('40%', 9)}</div>
      </div>
    </div>
  );
};
