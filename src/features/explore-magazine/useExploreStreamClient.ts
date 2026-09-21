import { useMemo } from 'react';

import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
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
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import type { ScoreScope, ViewerScoreScope } from './useViewerScoreScope';


/**
 * ============================================================================
 * DEAD-LISTED, NOT DELETED (PHASE D §5c). This is no longer the page's ranking
 * path: get_explore_stream serves All, Scores, Courses and Reviews. It stays for
 * two reasons - it is the REFERENCE MODEL for the scoring the RPC ports, and it
 * is the ROLLBACK. It is also still the live FALLBACK: the page re-enables it
 * whenever the RPC read is unavailable, and it is the only composer for Watch,
 * whose clips and long-form video are not in the ranker's pool.
 * ============================================================================
 * ORIGINALLY — PHASE A ONLY (BRIEF_EXPLORE_MAGAZINE §14, PHASE A).
 * ============================================================================
 *
 * This hook is a CLIENT-SIDE STAND-IN for get_explore_stream (§6d) and is
 * deleted from the page's path in Phase D. It exists so the UNIT can be judged
 * on device before any SQL is written, and it is honest about its limits:
 *
 *   NO LANES.        Everything is lane 'news'. The backlog rule (§6e) needs
 *                    arrived_at versus play_date, which means the RPC.
 *   PART GEOGRAPHY.  Phase B2 filters Scores with canonical club/course fields;
 *                    Phase C still owns geography rings and shelves.
 *   STANDING LIVE.   Phase B supplies typed round consequences from the viewer's
 *                    per-course board standing.
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

/** Repeat feats lift within bounded bands. No amount of a lower feat crosses a
 * rarer feat's floor, and the 0.3 cap prevents counts overpowering records. */
export function notability(item: StreamItem): number {
  const f = item.facts;
  const extra = (count: number, cap = 3) => Math.min(Math.max(count - 1, 0), cap);
  const aces = Math.max(0, f.holes_in_one ?? 0);
  const albatrosses = Math.max(0, f.albatrosses ?? 0);
  if (aces > 0) return 5 + 0.1 * extra(aces) + (albatrosses > 0 ? 0.05 : 0);
  if (albatrosses > 0) return 4.5 + 0.1 * extra(albatrosses);
  if (f.is_course_record) return 4;
  if (f.stableford != null && f.stableford >= 45) return 3.5;
  if (f.to_par != null && f.to_par < 0) return 3;
  if (f.eagles && f.eagles > 0) return 2.6 + 0.1 * extra(f.eagles);
  if (f.clean_card) return 2.5;
  if (f.birdies != null && f.birdies >= 5) return 2 + 0.05 * Math.min(f.birdies - 5, 6);
  if (item.kind === 'review' && f.rating != null && f.rating >= 9) return 2;
  return 0;
}

/** THE ONE SCORING MODEL. Exported so a candidate composed OUTSIDE this file
 *  (All's long-form video, BRIEF_EXPLORE_ALL_VIDEO §2) is scored by the same
 *  terms rather than by a second model written next to it. */
export function scoreItem(item: StreamItem): number {
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

/**
 * PHASE A's LOCAL ROUND CONSEQUENCE IS GONE (§3a). It could only see the
 * viewer's list, so every round by another member read as 'circle_round'. The
 * typed kinds now come from ./consequences, which reads standing, the record
 * book and the viewer's own bests. This file no longer decides consequences.
 */


/**
 * THE CADENCE PASS IS POSITIONAL, NOT A SCORE DAMP. Positional guarantees are
 * the only ones that hold when score gaps are large.
 */
function cadence(items: StreamItem[], byConsequence = false): StreamItem[] {
  const out: StreamItem[] = [];
  const pool = [...items];
  /* PHASE C: THE CADENCE KEY CARRIES THE RING. Two "Around Kent" cards in a row
     read as one repeated card even when their kinds differ, so the ring is part
     of the key rather than a second pass. */
  const keyOf = (item: StreamItem) =>
    `${byConsequence ? item.consequence?.kind ?? 'none' : item.kind}:${item.ring ?? 'none'}`;
  while (pool.length > 0) {
    const previous = out[out.length - 1];
    let index = 0;
    if (previous) {
      const previousKey = keyOf(previous);
      const different = pool.findIndex((candidate) => keyOf(candidate) !== previousKey);
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

/** The rings that are NOT the viewer's own or their club's (§3d). */
const OUTER: ReadonlySet<string> = new Set(['county', 'country', 'world']);
export const isOuterRing = (item: StreamItem) => !!item.ring && OUTER.has(item.ring);

/**
 * §3d THE OUTER-RING CAP IS POSITIONAL AND APPLIED AFTER SCORING — at most ONE
 * outer-ring card in every FOUR cards. Nothing is dropped: an outer-ring card
 * that cannot take its position is DEFERRED behind the next inner-ring card, so
 * a page whose whole pool is outer-ring still renders (the cap then admits one
 * per four and the rest follow in order).
 */
function capOuterRing(items: StreamItem[]): StreamItem[] {
  const out: StreamItem[] = [];
  const deferred: StreamItem[] = [];
  let sinceOuter = Infinity;
  const take = (item: StreamItem) => {
    out.push(item);
    sinceOuter = isOuterRing(item) ? 0 : sinceOuter + 1;
  };
  for (const item of items) {
    if (deferred.length > 0 && !isOuterRing(item) && sinceOuter >= 3) {
      take(deferred.shift() as StreamItem);
    }
    if (isOuterRing(item) && sinceOuter < 3) {
      deferred.push(item);
      continue;
    }
    take(item);
  }
  /* The remainder keeps its order rather than being discarded. */
  for (const item of deferred) out.push(item);
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

export function useExploreStreamClient(
  viewerId: string | undefined,
  view: ExploreView,
  scores?: { active: ScoreScope; geography: ViewerScoreScope },
  /* PHASE D §5c ADDITIVE, DEFAULT UNCHANGED. `enabled` defaults to true, so every
     existing caller behaves exactly as before. The page passes false while the
     RPC is serving the view, which stops this composition from issuing a single
     read - and passes true the moment the RPC read is unavailable, which is the
     fallback that keeps a failing RPC from blanking the page. */
  options?: { enabled?: boolean },
): ExploreStream {
  const enabled = options?.enabled ?? true;
  const wantsRounds = enabled && (view === 'all' || view === 'scores');
  const wantsWatch = enabled && (view === 'all' || view === 'watch');

  const circle = useCircleLatestRounds(wantsRounds ? viewerId : undefined, {
    limit: 14,
    scope: 'circle',
    windowDays: 30,
    includeSuggested: false,
    oneRoundPerMember: false,
    /* §3c THE VIEWER'S OWN ROUNDS ARE ADMITTED, deduped on score_id below. A
       stream of other people's rounds only ever moves the viewer down (§3b). */
    includeSelf: true,
  });
  const everyone = useCircleLatestRounds(wantsRounds ? viewerId : undefined, {
    limit: 14,
    scope: 'everyone',
    windowDays: 14,
    oneRoundPerMember: false,
  });
  /* §5c THE REVIEWS VIEW READS DEEPER THAN THE MIXED STREAM, because it is
     filtered by scope afterwards: a twelve-row read would empty a club scope on
     22-member data. The mixed stream keeps its twelve exactly as B2 shipped. */
  const wantsReviews = enabled && (view === 'all' || view === 'reviews');
  const reviews = useLatestReviews(view === 'reviews' ? 60 : 12, wantsReviews);
  const stories = useAmateurStories(null, enabled && view === 'all');
  const media = useDiscoverMediaPreview(wantsWatch);
  const moments = useMomentsOfTheWeek(30, { enabled: enabled && view === 'watch', candidateLimit: 72 });
  const { context, isFetched: contextFetched } = useViewerCourseContext(enabled ? viewerId : undefined);

  /**
   * §3c DEDUPE ON score_id, NOT round_id. The viewer now appears in BOTH the
   * circle read (as themselves) and the everyone read, and the two reads build
   * their row ids independently — score_id is the round's identity, and a round
   * with no score_id has no card to open, so it is dropped here.
   */
  const roundRows = useMemo(() => {
    if (!wantsRounds) return [];
    const out: CircleRoundRow[] = [];
    const taken = new Set<string>();
    for (const row of [...(circle.data ?? []), ...(everyone.data ?? [])]) {
      if (!row.score_id || taken.has(row.score_id)) continue;
      taken.add(row.score_id);
      out.push(row);
    }
    return out;
  }, [circle.data, everyone.data, wantsRounds]);
  const circleScoreIds = useMemo(
    () => new Set((circle.data ?? []).map((row) => row.score_id).filter((id): id is string => !!id)),
    [circle.data],
  );

  /* THE CONSEQUENCE SOURCES (§3a). Standing supplies every rank and every field
     size; the record book supplies who holds what; bests decide only whether a
     round passed the viewer. */
  const standing = useViewerStanding(wantsRounds ? viewerId : undefined);
  const standingMap = useMemo(() => {
    const map = new Map<string, StandingRow>();
    for (const row of standing.rows) map.set(row.course_id, row);
    return map;
  }, [standing.rows]);
  const bests = useViewerCourseBests(wantsRounds ? viewerId : undefined);
  const roundCourseIds = useMemo(
    () => roundRows.map((row) => row.course_id).filter((id): id is string => !!id),
    [roundRows],
  );
  /* §5c THE REVIEW COURSES JOIN THE SAME METADATA READ. Scope and ring are
     decided from the canonical club id and exact region, exactly as rounds are —
     the review row's own course_region is a display string, not a scope key. */
  const metaCourseIds = useMemo(() => {
    const ids = new Set(roundCourseIds);
    if (view === 'all' || view === 'reviews') for (const review of reviews.reviews ?? []) ids.add(review.courseId);
    return [...ids];
  }, [roundCourseIds, reviews.reviews, view]);
  const roundCourseMeta = useCourseCardMeta(metaCourseIds);
  const records = useCourseRecordSignal(viewerId, roundCourseIds);

  const lastSeen = useMemo(() => readDiscoverLastSeen(viewerId), [viewerId]);

  const items = useMemo<StreamItem[]>(() => {
    const out: StreamItem[] = [];
    const seenAt = (iso: string | null | undefined) => {
      if (!lastSeen || !iso) return false;
      const at = new Date(iso).getTime();
      return Number.isFinite(at) && at < lastSeen;
    };

    if (wantsRounds) {
      for (const row of roundRows) {
        const course = row.course_id ? roundCourseMeta.data?.get(row.course_id) : null;
        const geography = scores?.geography;
        if (view === 'scores') {
          const active = scores?.active ?? 'world';
          const inScope = active === 'world'
            || (active === 'club' && !!geography?.primaryClubId && course?.clubId === geography.primaryClubId)
            || (active === 'county' && !!geography?.county && course?.rawRegion === geography.county)
            || (active === 'country' && !!geography?.country && course?.subCountry === geography.country);
          if (!inScope) continue;
        }
        /* PHASE C §3d THE RING, from the SHARED resolver's geography — never
           re-derived here. Nearest ring wins; a course whose geography has not
           resolved carries NO ring rather than a guessed world one. */
        const ring: StreamItem['ring'] = row.is_self
          ? 'own'
          : geography?.primaryClubId && course?.clubId === geography.primaryClubId
            ? 'club'
            : geography?.county && course?.rawRegion === geography.county
              ? 'county'
              : geography?.country && course?.subCountry === geography.country
                ? 'country'
                : course
                  ? 'world'
                  : null;
        const toPar = row.gross != null && row.course_par != null ? row.gross - row.course_par : null;
        const consequence = consequenceFor(
          {
            courseId: row.course_id,
            userId: row.user_id,
            gross: row.gross,
            playDate: row.play_date,
            isSelf: row.is_self,
            isCircle: !!row.score_id && circleScoreIds.has(row.score_id),
            isNotable: row.holes_in_one > 0 || row.albatrosses > 0 || (row.eagles ?? 0) > 0 || row.is_course_record
              || (row.stableford_points ?? 0) >= 45 || toPar != null && toPar < 0
              || row.clean_card || (row.birdies ?? 0) >= 5,
          },
          { standing: standingMap, records, bests: bests.bests, shortlist: context.shortlist },
        );
        const recordHolder = row.course_id ? records.holders.get(row.course_id) ?? null : null;
        const recordMargin = recordHolder?.runner_up_value != null
          ? recordHolder.runner_up_value - recordHolder.value
          : null;
        /* §3d NO CONSEQUENCE, NO CARD — UNLESS IT IS AN OUTER RING. A county /
           country / world round at a course the viewer has never played carries
           NO invented consequence: it is admitted as a plain "someone played
           here" card, wearing its ring kicker only, and the 1-in-4 positional
           cap bounds how many of them the page can show. An outer-ring card
           with no resolvable target (no course, no scorecard) still does not
           render. */
        const outerPlain = !consequence && ring !== null && ring !== 'own' && ring !== 'club';
        if (!consequence && !(outerPlain && !!row.course_id && !!row.score_id)) continue;
        const item: StreamItem = {
          id: `round:${row.round_id}`,
          kind: 'round',
          ring,
          lane: 'news',
          score: 0,
          consequence,

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
            record_margin: recordMargin,
            hcp_at_time: row.hcp_at_time,
          },
          payload: { round: row },
          seen: seenAt(row.play_date),
        };
        out.push(item);
      }
    }

    if (wantsReviews) {
      const geography = scores?.geography;
      for (const review of reviews.reviews ?? []) {
        const course = roundCourseMeta.data?.get(review.courseId) ?? null;
        /* §5c THE SCOPE ROW FILTERS THE REVIEWS VIEW, and nothing else: the
           mixed stream's reviews are unscoped, as B2 shipped them. */
        if (view === 'reviews') {
          const active = scores?.active ?? 'world';
          const inScope = active === 'world'
            || (active === 'club' && !!geography?.primaryClubId && course?.clubId === geography.primaryClubId)
            || (active === 'county' && !!geography?.county && course?.rawRegion === geography.county)
            || (active === 'country' && !!geography?.country && course?.subCountry === geography.country);
          if (!inScope) continue;
        }
        const yours = context.ratings.get(review.courseId) ?? null;
        const consequence: Consequence | null = yours != null
          ? { kind: 'review_disagree', theirs: review.rating, yours }
          : context.shortlist.has(review.courseId)
            ? { kind: 'review_on_list', theirs: review.rating }
            : review.rating >= 9
              ? { kind: 'platform_notable' }
              : null;
        /* THE RING IS THE SAME LADDER THE ROUNDS USE — nearest wins, and an
           unresolved course carries no ring rather than a guessed world one. */
        const ring: StreamItem['ring'] = geography?.primaryClubId && course?.clubId === geography.primaryClubId
          ? 'club'
          : geography?.county && course?.rawRegion === geography.county
            ? 'county'
            : geography?.country && course?.subCountry === geography.country
              ? 'country'
              : course
                ? 'world'
                : null;
        out.push({
          id: `review:${review.reviewId}`,
          kind: 'review',
          ring,
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

    if (enabled && view === 'all') {
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
            standfirst: story.standfirst ?? null,
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
      /* LONG-FORM ON ALL IS NOT COMPOSED HERE (BRIEF_EXPLORE_ALL_VIDEO §2).
         All's video candidates come from the SAME read Watch uses
         (useWatchVideos / get_long_form_videos_v2), merged by the page. Leaving
         the media-preview videos in this pool too would be a SECOND long-form
         source on one page, which the brief forbids. Watch is unchanged. */
      const videos = view === 'watch' ? media.data?.videos ?? [] : [];
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

    if (enabled && view === 'watch') {
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
    /* THE ORDER IS: score, then cadence (kind/consequence AND ring), then the
       positional outer-ring cap. The cap runs LAST because it is a positional
       guarantee, and a score damp could not make one. */
    /* §5c A SINGLE-KIND VIEW CADENCES BY CONSEQUENCE, since every card's kind is
       the same and the kind key would make the pass a no-op. */
    return capOuterRing(cadence(out, view === 'scores' || view === 'reviews'));
  }, [roundRows, circleScoreIds, reviews.reviews, stories.stories, media.data, moments.data, context, standingMap, records, bests.bests, lastSeen, view, viewerId, enabled, wantsRounds, wantsWatch, wantsReviews, roundCourseMeta.data, scores?.active, scores?.geography]);

  /* READINESS IS isFetched, NEVER isLoading: a disabled query reports isLoading
     false and would report the page ready before anything had been asked for.
     THE CONSEQUENCE SOURCES ARE PART OF READINESS: a round rendered before
     standing lands would state a weaker consequence and then change under the
     member's eyes. An UNRESOLVED source is still fetched — it renders no
     consequence rather than a wrong one. */
  const isFetched =
    contextFetched &&
    (!wantsRounds || (circle.isFetched && everyone.isFetched && standing.isFetched && bests.isFetched && records.isFetched
      && (view !== 'scores' || roundCourseIds.length === 0 || roundCourseMeta.isFetched))) &&
    (view !== 'reviews' || metaCourseIds.length === 0 || roundCourseMeta.isFetched) &&
    (!wantsReviews ? true : !reviews.isPending) &&
    (!enabled || view !== 'all' ? true : !stories.isPending) &&
    (!wantsWatch || media.isFetched) &&
    (!enabled || view !== 'watch' || moments.isFetched);


  return { items, total: items.length, isFetched, isPending: !isFetched && items.length === 0 };
}

/** The first sentence of a review, for the quote headline. */
function firstSentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : clean).slice(0, 220);
}
