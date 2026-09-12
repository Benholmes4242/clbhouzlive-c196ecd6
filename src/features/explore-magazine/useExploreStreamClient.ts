import { useMemo } from 'react';

import { useCircleLatestRounds } from '@/hooks/gam/useCircleLatestRounds';
import { useLatestReviews } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';
import { useDiscoverMediaPreview } from '@/components/explore-tab-new/courseled/hooks/useDiscoverMediaPreview';
import { useMomentsOfTheWeek } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import { useAmateurStories } from '@/features/amateur/news/useAmateurStories';
import { readDiscoverLastSeen } from '@/hooks/useDiscoverLastSeen';

import type { ExploreView } from './exploreViewMemory';
import { RING_WEIGHT, consequenceWeight, type Consequence, type StreamItem } from './streamItem';
import { useViewerCourseContext, type ViewerCourseContext } from './useViewerCourseContext';
import { roundConsequence as consequenceFor } from './consequences';
import { useCourseRecordSignal } from './useCourseRecordSignal';
import { useViewerCourseBests } from './useViewerCourseBests';
import { useViewerStanding, type StandingRow } from './useViewerStanding';


/**
 * ============================================================================
 * TEMPORARY — PHASE A ONLY (BRIEF_EXPLORE_MAGAZINE §14, PHASE A).
 * ============================================================================
 *
 * This hook is a CLIENT-SIDE STAND-IN for get_explore_stream (§6d) and is
 * deleted from the page's path in Phase D. It exists so the UNIT can be judged
 * on device before any SQL is written, and it is honest about its limits:
 *
 *   NO LANES.        Everything is lane 'news'. The backlog rule (§6e) needs
 *                    arrived_at versus play_date, which means the RPC.
 *   NO GEOGRAPHY.    ring is 'own' or null. Club/county/country arrive in
 *                    Phase C, so the outer-ring 1-in-4 cadence cap has nothing
 *                    to act on yet and is not simulated.
 *   NO STANDING.     rank_down / rank_up / rank_hold / played_nochange and a
 *                    record card's GAP sentence all need the viewer's rank per
 *                    course (Phase B). They are never emitted here.
 *   NO KEYSET.       Depth is a client pool revealed a page at a time. The real
 *                    cursor is (score, id) from the RPC.
 *
 * WHAT IS REAL, and carried forward unchanged into §6: the consequence ORDER as
 * the heaviest signal, ring second, freshness on arrival with a ~96h half-life,
 * notability in the settled achievement order, and SEEN AS A BINARY HALVING of
 * the consequence and ring terms — never a multiplicative decay, which is what
 * gave never-shown content a 20x advantage on 12 Aug.
 *
 * LIFTED FROM heroCards.ts: its qualification READING only — floors before
 * ranking, and a tie is a reason to reject a claim rather than to pick one. No
 * code was copied, and NET is not recomputed here (gam_round_net is the one
 * source, and Phase A shows no net figure at all).
 */

const HALF_LIFE_H = 96;
const W_CONSEQUENCE = 6;
const W_RING = 3;
const W_FRESH = 4;
const W_NOTABLE = 1;
/** A story is a card, not a lead: the ranker weights it down rather than
 *  banning it, and the cadence pass refuses to let it lead (§6d). */
const STORY_DAMP = 0.6;

export const STREAM_PAGE_SIZE = 12;

function freshness(iso: string | null | undefined): number {
  if (!iso) return 0;
  const at = new Date(iso).getTime();
  if (!Number.isFinite(at)) return 0;
  const hours = Math.max(0, (Date.now() - at) / 3_600_000);
  return 0.5 ** (hours / HALF_LIFE_H);
}

/** The settled achievement order: ace > albatross > record > 45pts > under par
 *  > bogey free > birdie haul. Reviews at 9.0+ are notable. */
function notability(item: StreamItem): number {
  const f = item.facts;
  if (f.holes_in_one && f.holes_in_one > 0) return 5;
  if (f.albatrosses && f.albatrosses > 0) return 4.5;
  if (f.is_course_record) return 4;
  if (f.stableford != null && f.stableford >= 45) return 3.5;
  if (f.to_par != null && f.to_par < 0) return 3;
  if (f.clean_card) return 2.5;
  if (f.birdies != null && f.birdies >= 5) return 2;
  if (item.kind === 'review' && f.rating != null && f.rating >= 9) return 2;
  return 0;
}

function scoreItem(item: StreamItem): number {
  /* SEEN IS BINARY AND NEVER EXCLUDES. It halves consequence and ring; the
     freshness term is left alone, so an old-but-unseen item does not leapfrog a
     fresh one. Nothing is ever removed for having been seen. */
  const damp = item.seen ? 0.5 : 1;
  const base =
    W_CONSEQUENCE * consequenceWeight(item.consequence?.kind) * damp +
    W_RING * (item.ring ? RING_WEIGHT[item.ring] : 0) * damp +
    W_FRESH * freshness(item.facts.arrived_at ?? item.facts.play_date ?? item.facts.published_at) +
    W_NOTABLE * notability(item);
  return item.kind === 'story' ? base * STORY_DAMP : base;
}

function roundConsequence(courseId: string | null, gross: number | null, bestHere: number | null, isSelf: boolean, ctx: ViewerCourseContext): Consequence | null {
  if (courseId && ctx.shortlist.has(courseId) && gross != null && bestHere != null && gross <= bestHere) {
    return { kind: 'list_new_low', n: gross };
  }
  if (courseId && ctx.shortlist.has(courseId)) return { kind: 'list_first' };
  if (isSelf) return null;
  return { kind: 'circle_round' };
}

/**
 * THE CADENCE PASS IS POSITIONAL, NOT A SCORE DAMP. Positional guarantees are
 * the only ones that hold when score gaps are large.
 */
function cadence(items: StreamItem[]): StreamItem[] {
  const out: StreamItem[] = [];
  const pool = [...items];
  while (pool.length > 0) {
    const previous = out[out.length - 1];
    let index = 0;
    if (previous) {
      const different = pool.findIndex((candidate) => candidate.kind !== previous.kind);
      if (different >= 0) index = different;
    }
    /* A STORY NEVER LEADS unless it is the only candidate. */
    if (out.length === 0 && pool[index].kind === 'story') {
      const notStory = pool.findIndex((candidate) => candidate.kind !== 'story');
      if (notStory >= 0) index = notStory;
    }
    out.push(pool.splice(index, 1)[0]);
  }
  return out;
}

export interface ExploreStream {
  items: StreamItem[];
  /** Real pool total, never a rendered count. */
  total: number;
  isFetched: boolean;
  /** True while the first useful block is still resolving. */
  isPending: boolean;
}

export function useExploreStreamClient(viewerId: string | undefined, view: ExploreView): ExploreStream {
  const wantsRounds = view === 'all' || view === 'scores';
  const wantsWatch = view === 'all' || view === 'watch';

  const circle = useCircleLatestRounds(viewerId, {
    limit: 14,
    scope: 'circle',
    windowDays: 30,
    includeSuggested: false,
    oneRoundPerMember: false,
  });
  const everyone = useCircleLatestRounds(viewerId, {
    limit: 14,
    scope: 'everyone',
    windowDays: 14,
    oneRoundPerMember: false,
  });
  const reviews = useLatestReviews(12, view === 'all' || view === 'reviews');
  const stories = useAmateurStories(null);
  const media = useDiscoverMediaPreview(wantsWatch);
  const moments = useMomentsOfTheWeek(30, { enabled: view === 'watch', candidateLimit: 72 });
  const { context, isFetched: contextFetched } = useViewerCourseContext(viewerId);

  const lastSeen = useMemo(() => readDiscoverLastSeen(viewerId), [viewerId]);

  const items = useMemo<StreamItem[]>(() => {
    const out: StreamItem[] = [];
    const seenAt = (iso: string | null | undefined) => {
      if (!lastSeen || !iso) return false;
      const at = new Date(iso).getTime();
      return Number.isFinite(at) && at < lastSeen;
    };

    if (wantsRounds) {
      const rows = [...(circle.data ?? []), ...(everyone.data ?? [])];
      const takenRounds = new Set<string>();
      for (const row of rows) {
        if (takenRounds.has(row.round_id)) continue;
        takenRounds.add(row.round_id);
        if (!row.score_id) continue; // a card with no resolvable target does not render
        const toPar = row.gross != null && row.course_par != null ? row.gross - row.course_par : null;
        const item: StreamItem = {
          id: `round:${row.round_id}`,
          kind: 'round',
          /* GEOGRAPHY IS PHASE C: 'own' or nothing. */
          ring: row.is_self ? 'own' : null,
          lane: 'news',
          score: 0,
          consequence: roundConsequence(row.course_id, row.gross, row.best_here, row.is_self, context),
          subject: {
            course_id: row.course_id,
            course_name: row.course_name,
            region: null,
            sub_country: null,
            image_url: null,
            pending: true,
          },
          who: {
            user_id: row.user_id,
            display_name: row.display_name,
            photo_url: row.profile_photo_url,
            is_viewer: row.is_self,
          },
          facts: {
            gross: row.gross,
            course_par: row.course_par,
            to_par: toPar,
            net: row.net,
            stableford: row.stableford_points,
            score_id: row.score_id,
            connection_id: row.connection_id,
            play_date: row.play_date,
            /* PHASE A HAS NO INGEST TIME for a round: useCircleLatestRounds does
               not select it. play_date stands in, which is why the backlog rule
               cannot be honoured until the RPC returns arrived_at (§6e). */
            arrived_at: row.play_date,
            birdies: row.birdies,
            eagles: row.eagles,
            albatrosses: row.albatrosses,
            holes_in_one: row.holes_in_one,
            clean_card: row.clean_card,
            is_course_record: row.is_course_record,
            hcp_at_time: row.hcp_at_time,
          },
          payload: { round: row },
          seen: seenAt(row.play_date),
        };
        out.push(item);
      }
    }

    if (view === 'all' || view === 'reviews') {
      for (const review of reviews.reviews ?? []) {
        const yours = context.ratings.get(review.courseId) ?? null;
        const consequence: Consequence | null = yours != null
          ? { kind: 'review_disagree', theirs: review.rating, yours }
          : context.shortlist.has(review.courseId)
            ? { kind: 'review_on_list', theirs: review.rating }
            : review.rating >= 9
              ? { kind: 'platform_notable' }
              : null;
        out.push({
          id: `review:${review.reviewId}`,
          kind: 'review',
          ring: null,
          lane: 'news',
          score: 0,
          consequence,
          subject: {
            course_id: review.courseId,
            course_name: review.courseName,
            region: review.courseRegion,
            sub_country: review.courseSubCountry,
            /* A REVIEW USES ITS OWN FIRST PHOTOGRAPH, then the course image. */
            image_url: review.mediaType === 'image' ? review.mediaUrl ?? review.courseImage : review.posterUrl ?? review.courseImage,
            pending: false,
          },
          who: {
            user_id: review.userId,
            display_name: review.reviewerName,
            photo_url: review.reviewerAvatar,
            is_viewer: !!viewerId && review.userId === viewerId,
          },
          facts: {
            rating: review.rating,
            review_id: review.reviewId,
            first_sentence: firstSentence(review.quote),
            arrived_at: review.at,
            play_date: review.at,
          },
          payload: { review },
          seen: seenAt(review.at),
        });
      }
    }

    if (view === 'all') {
      for (const story of stories.stories ?? []) {
        out.push({
          id: `story:${story.id}`,
          kind: 'story',
          ring: null,
          lane: 'news',
          score: 0,
          consequence: null,
          subject: story.image_url
            ? { course_id: null, course_name: null, region: null, sub_country: null, image_url: story.image_url, pending: false }
            : null,
          who: null,
          facts: {
            headline: story.headline,
            story_slug: story.slug,
            /* amateur_stories carries no source column; the kicker is the nearest
               honest thing and is absent rather than invented when null. */
            source: story.kicker ?? null,
            published_at: story.published_at ?? null,
            arrived_at: story.published_at ?? null,
          },
          payload: {},
          seen: seenAt(story.published_at ?? null),
        });
      }
    }

    if (wantsWatch) {
      const clips = view === 'watch' ? media.data?.clips ?? [] : [];
      const videos = media.data?.videos ?? [];
      for (const entry of [...videos.map((v) => ['watch', v] as const), ...clips.map((c) => ['clip', c] as const)]) {
        const [kind, mediaItem] = entry;
        out.push({
          id: `${kind}:${mediaItem.postId}:${mediaItem.mediaId}`,
          kind,
          ring: null,
          lane: 'news',
          score: 0,
          consequence: null,
          subject: {
            course_id: mediaItem.courseId,
            course_name: mediaItem.courseName ?? null,
            region: null,
            sub_country: null,
            image_url: mediaItem.thumbnail ?? null,
            pending: false,
          },
          who: {
            user_id: mediaItem.post.userId,
            display_name: mediaItem.displayName,
            photo_url: mediaItem.post.avatarUrl ?? null,
            is_viewer: !!viewerId && mediaItem.post.userId === viewerId,
          },
          facts: {
            headline: mediaItem.title ?? null,
            duration_s: mediaItem.duration,
            post_id: mediaItem.postId,
            media_id: mediaItem.mediaId,
            arrived_at: mediaItem.createdAt ?? null,
            published_at: mediaItem.createdAt ?? null,
          },
          payload: { media: mediaItem },
          seen: seenAt(mediaItem.createdAt ?? null),
        });
      }
    }

    if (view === 'watch') {
      for (const moment of moments.data ?? []) {
        out.push({
          id: `moment:${moment.key}`,
          kind: 'moment',
          ring: null,
          lane: 'news',
          score: 0,
          consequence: null,
          subject: {
            course_id: moment.courseId,
            course_name: moment.courseName,
            region: moment.region,
            sub_country: null,
            image_url: moment.thumbnail,
            pending: false,
          },
          who: {
            user_id: moment.post.userId,
            display_name: moment.post.displayName,
            photo_url: moment.post.avatarUrl ?? null,
            is_viewer: !!viewerId && moment.post.userId === viewerId,
          },
          facts: {
            duration_s: moment.durationSeconds ?? null,
            post_id: moment.post.id,
            media_id: moment.mediaId ?? null,
            arrived_at: moment.post.createdAt ?? null,
          },
          payload: { moment },
          seen: seenAt(moment.post.createdAt ?? null),
        });
      }
    }

    for (const item of out) item.score = scoreItem(item);
    out.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id));
    return cadence(out);
  }, [circle.data, everyone.data, reviews.reviews, stories.stories, media.data, moments.data, context, lastSeen, view, viewerId, wantsRounds, wantsWatch]);

  /* READINESS IS isFetched, NEVER isLoading: a disabled query reports isLoading
     false and would report the page ready before anything had been asked for. */
  const isFetched =
    contextFetched &&
    (!wantsRounds || (circle.isFetched && everyone.isFetched)) &&
    (view !== 'all' && view !== 'reviews' ? true : !reviews.isPending) &&
    (view !== 'all' ? true : !stories.isPending) &&
    (!wantsWatch || media.isFetched) &&
    (view !== 'watch' || moments.isFetched);

  return { items, total: items.length, isFetched, isPending: !isFetched && items.length === 0 };
}

/** The first sentence of a review, for the quote headline. */
function firstSentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : clean).slice(0, 220);
}
