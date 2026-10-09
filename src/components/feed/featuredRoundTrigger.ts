/**
 * FEATURED ROUNDS — which Home round post renders the hero (FeaturedRoundCard)
 * instead of the ordinary round card. Pure: reads only what Home already has
 * (PostRound counters, the page-level record signal). No query lives here.
 *
 * Precedence, first match wins: albatross, hole in one, birdie run (>= 5 in a
 * row), eagle brace (>= 2), CONTESTED course record. The record test is the
 * consequence engine's isRecordRound identity match — never a second one —
 * plus runner_up_value non-null (a record won against an empty field is not
 * featured). No net record in this version.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { isRecordRound } from '@/features/explore-magazine/consequences';
import type { CourseRecordSignal } from '@/features/explore-magazine/useCourseRecordSignal';
import type { FeaturedRound } from '@/features/explore-magazine/useFeaturedRound';
import { roundScore } from './roundGross';

export const BIRDIE_RUN_HERO_MIN = 5;

export type FeaturedTrigger =
  | { tier: 1; reason: 'feed_albatross' | 'hole_in_one' }
  | { tier: 3; reason: 'birdie_run' | 'eagle_brace' }
  | { tier: 2; reason: 'course_record' };

export function featuredTriggerFor(
  post: FeedPost,
  round: PostRound | null,
  records: CourseRecordSignal | null,
): FeaturedTrigger | null {
  if (!round) return null;
  if ((round.albatrosses ?? 0) >= 1) return { tier: 1, reason: 'feed_albatross' };
  if ((round.holesInOne ?? 0) >= 1) return { tier: 1, reason: 'hole_in_one' };
  if ((round.longestBirdieRun ?? 0) >= BIRDIE_RUN_HERO_MIN) return { tier: 3, reason: 'birdie_run' };
  if ((round.eagles ?? 0) >= 2) return { tier: 3, reason: 'eagle_brace' };
  if (records && post.courseId) {
    const gross = roundScore(round)?.gross ?? null;
    const hit = isRecordRound(
      { courseId: post.courseId, userId: post.userId ?? null, gross, playDate: round.playDate, isSelf: false, isCircle: false, isNotable: false },
      records,
    );
    if (hit && records.holders.get(post.courseId)?.runner_up_value != null) {
      return { tier: 2, reason: 'course_record' };
    }
  }
  return null;
}

/**
 * FIRST-PAINT DECISION. A post's hero/ordinary choice is made once, the first
 * time its round card paints, and never revised: an unresolved source (records
 * still null, course meta pending, week pick unknown = undefined) renders the
 * ordinary card and that sticks. The week's pick is never an inline hero — the
 * Home rail owns it. `decisions` is owned by the feed and cleared on reset.
 */
export function decideFeatured(
  decisions: Map<string, FeaturedTrigger | null>,
  post: FeedPost,
  round: PostRound,
  records: CourseRecordSignal | null | undefined,
  subjectPending: boolean,
  weekPickScoreId: string | null | undefined,
): FeaturedTrigger | null {
  if (decisions.has(post.id)) return decisions.get(post.id) ?? null;
  const ready = !!records && !subjectPending && weekPickScoreId !== undefined;
  const decision = !ready || weekPickScoreId === round.whsScoreId
    ? null
    : featuredTriggerFor(post, round, records);
  decisions.set(post.id, decision);
  return decision;
}

/** The hero's round shape, built from the post and its round. */
export function featuredRoundFrom(
  post: FeedPost,
  round: PostRound,
  trigger: FeaturedTrigger,
  imageUrl: string | null,
): FeaturedRound {
  const score = roundScore(round);
  return {
    whs_score_id: round.whsScoreId,
    user_id: post.userId,
    display_name: post.displayName ?? null,
    photo_url: post.avatarUrl ?? null,
    course_id: post.courseId ?? '',
    course_name: post.courseName ?? null,
    image_url: imageUrl,
    play_date: round.playDate ?? '',
    gross: score?.gross ?? null,
    course_par: round.coursePar,
    to_par: score?.toPar ?? null,
    stableford: null,
    birdies: round.birdies,
    eagles: round.eagles,
    albatrosses: round.albatrosses,
    holes_in_one: round.holesInOne,
    clean_card: round.cleanCard,
    net_score: round.netScore,
    vs_hcp: null,
    tier: trigger.tier,
    reason: trigger.reason,
    joint_name: null,
    joint_count: 0,
    birdie_run: round.longestBirdieRun,
  };
}
