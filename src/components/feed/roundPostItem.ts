/**
 * roundPostItem — a Home round post, expressed as the Explore stream unit so
 * the Home feed renders THE Explore round card (ExploreCard) rather than a
 * copy of it. One card, one identity: this file only translates; it draws
 * nothing and fetches nothing.
 *
 * Every figure comes from data the feed already batched (usePostRounds,
 * roundScore). Facts the Home chain does not carry are left null, never
 * guessed — ExploreCard already renders absent facts as nothing:
 *   - consequence / ring: Home has no viewer-standing read, so no record or
 *     rank callout is claimed. Feat callouts still come from the round facts.
 *   - current_handicap_index: not on PostRound; the who-line keeps it unread.
 *   - net: gam_round_net.net_score, already viewer-gated server-side.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import { roundScore } from './roundGross';

export function roundPostItem(
  post: FeedPost,
  round: PostRound | null,
  currentUserId: string | null | undefined,
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
    consequence: null,
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
