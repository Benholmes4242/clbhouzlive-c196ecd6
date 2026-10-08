/**
 * roundPostItem — a Home round post, expressed as the Explore stream unit so
 * the Home feed renders THE Explore round card (ExploreCard) rather than a
 * copy of it. One card, one identity: this file only translates; it draws
 * nothing and fetches nothing.
 *
 * Every figure comes from data the feed already batched (usePostRounds,
 * roundScore). Facts the Home chain does not carry are left null, never
 * guessed — ExploreCard already renders absent facts as nothing:
 *   - consequence: roundConsequence (the ONE consequence engine), fed the
 *     page-level sources Clubhouse reads once per page — the shared
 *     get_viewer_standing read the "Where you stand" shelf uses, the viewer's
 *     course bests, the record book and the viewer's shortlist. So Home DOES
 *     claim record and rank callouts. sources === null means a source has not
 *     fetched yet: no line, never a provisional one. Home has no circle
 *     source and no notable predicate, so isCircle / isNotable are false.
 *   - ring: stays null PERMANENTLY. It is read only by streamItem's
 *     RING_WEIGHT table and Explore's ranker, never by ExploreCard or
 *     cardTreatment — a ranking input, and Home ranks with
 *     get_suggested_feed_v3. Filling it in draws nothing.
 *   - current_handicap_index: not on PostRound; the who-line keeps it unread.
 *   - net: gam_round_net.net_score, already viewer-gated server-side.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import { roundConsequence, type ConsequenceSources } from '@/features/explore-magazine/consequences';
import { roundScore } from './roundGross';

export function roundPostItem(
  post: FeedPost,
  round: PostRound | null,
  currentUserId: string | null | undefined,
  sources: ConsequenceSources | null = null,
): StreamItem {
  const score = round ? roundScore(round) : null;
  const isViewer = !!currentUserId && post.userId === currentUserId;
  const playDate = round?.playDate ?? null;
  /* RoundShape reads round_id (an SVG id seed) and the two nine to-pars
     (meta row only, which Explore's call hides with showMeta={false}). The
     rest of CircleRoundRow is never read on this path. */
  const shapeRow = round
    ? ({ round_id: round.whsScoreId, front_nine_to_par: null, back_nine_to_par: null } as unknown as CircleRoundRow)
    : undefined;
  return {
    id: `round-post:${post.id}`,
    kind: 'round',
    ring: null,
    lane: 'news',
    score: 0,
    consequence: sources && round
      ? roundConsequence(
          {
            courseId: post.courseId ?? null,
            userId: post.userId ?? null,
            gross: score?.gross ?? null,
            playDate,
            isSelf: isViewer,
            isCircle: false,
            isNotable: false,
          },
          sources,
        )
      : null,
    subject: {
      course_id: post.courseId ?? null,
      course_name: post.courseName ?? null,
      region: null,
      sub_country: null,
      image_url: post.courseThumbnailImage ?? null,
      pending: false,
    },
    who: {
      user_id: post.userId ?? null,
      display_name: post.displayName ?? null,
      photo_url: post.avatarUrl ?? null,
      is_viewer: isViewer,
    },
    facts: {
      gross: score?.gross ?? null,
      course_par: round?.coursePar ?? null,
      to_par: score?.toPar ?? null,
      net: round?.netScore ?? null,
      delta_index: round?.deltaIndex ?? null,
      score_id: round?.whsScoreId ?? null,
      play_date: playDate,
      arrived_at: playDate,
      birdies: round?.birdies ?? null,
      eagles: round?.eagles ?? null,
      albatrosses: round?.albatrosses ?? null,
      holes_in_one: round?.holesInOne ?? null,
      clean_card: round?.cleanCard ?? null,
      post_id: post.id,
    },
    payload: { round: shapeRow },
    seen: false,
  };
}
