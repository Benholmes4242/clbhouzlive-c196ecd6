import { useEffect, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

import { courseHeadline } from './courseHeadline';
import { trackError } from '@/lib/errorTracking';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { exploreKeys } from './exploreKeys';
import type { ExploreView } from './exploreViewMemory';
import { STREAM_PAGE_SIZE } from './useExploreStreamClient';
import type {
  Consequence,
  ExploreKind,
  ExploreLane,
  ExploreRing,
  StreamFacts,
  StreamItem,
  StreamPayload,
  StreamSubject,
  StreamWho,
} from './streamItem';

/**
 * THE SERVER RANKER (BRIEF_EXPLORE_MAGAZINE PHASES D1-D3).
 *
 * One RPC ranks the whole eligible universe and hands back one page plus an
 * opaque keyset cursor, so the page no longer ends where a fetched pool ends.
 * D3 serves All, Scores, Courses and Reviews. WATCH IS NOT ON THE RPC and stays
 * client-composed: its sources are clips and long-form video, which are not in
 * the ranker's pool, so Watch keeps its current finite depth - a stated limit,
 * reported rather than hidden.
 *
 * The draft SQL is docs/sql/explore_stream_d3.sql and is Ben's to run; the local
 * PG16 harness (scripts/explore-d3-harness.sh) proves per-view candidates, the
 * scope predicate, keyset integrity, the single-type cadence, standing fidelity
 * and that All's first page is IDENTICAL under the deployed D2 body and D3.
 *
 * COURSE COPY IS COMPOSED HERE, not in SQL: the RPC returns the figures and the
 * shared courseHeadline() turns them into the member's own language, from the
 * same locale keys the client composition uses.
 *
 * UNTIL BEN RUNS THE DRAFT this read errors, `unavailable` is true, and
 * ExploreMagazine keeps the accepted client composition. That is a deliberate
 * fallback, not a silent one: nothing renders empty and nothing claims zero.
 *
 * ORDER IS THE SERVER'S. The client re-sorts nothing — cadence, the outer-ring
 * cap and the story rule are already applied per page, with the cadence tail
 * travelling in the cursor so a page seam does not reset them.
 *
 * VIEWER AND SCOPE ARE IN THE KEY. Every answer here is about one member.
 */

export interface StreamRow {
  id: string;
  kind: ExploreKind;
  ring: ExploreRing | null;
  lane: ExploreLane;
  score: number;
  consequence: Consequence | null;
  subject: StreamSubject | null;
  who: StreamWho | null;
  facts: StreamFacts;
  seen: boolean;
  /** Diagnostic, like score: the cadence cap relaxed to keep the page full. */
  relaxed: boolean;
  next_cursor: Record<string, unknown> | null;
}

export interface ExploreStreamPage {
  items: StreamItem[];
  cursor: Record<string, unknown> | null;
}

export interface ExploreServerStream {
  items: StreamItem[];
  total: number;
  isFetched: boolean;
  isPending: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** True when the RPC is not on the project yet, or the read failed. */
  unavailable: boolean;
}

/** A round card's hole-shape strip and its sheet read this shape. Only the
 *  fields the RPC can honestly fill are filled; the rest stay null rather than
 *  being invented, exactly as the client model treats an unresolved fact. */
function roundPayload(row: StreamRow): CircleRoundRow | undefined {
  const f = row.facts;
  if (!f.score_id) return undefined;
  return {
    round_id: row.id,
    score_id: f.score_id,
    connection_id: f.connection_id ?? null,
    user_id: row.who?.user_id ?? '',
    display_name: row.who?.display_name ?? '',
    profile_photo_url: row.who?.photo_url ?? null,
    player_club_id: null,
    play_date: f.play_date ?? '',
    course_name: row.subject?.course_name ?? null,
    course_id: row.subject?.course_id ?? null,
    gross: f.gross ?? null,
    course_par: f.course_par ?? null,
    rounds_here: null,
    best_here: null,
    avg_gross_here: null,
    net: f.net ?? null,
    hcp_delta: null,
    hcp_at_time: f.hcp_at_time ?? null,
    /* Server stream cards do not disclose the Circle rail's current-index pair.
       These explicit closed defaults preserve their existing rendering. */
    current_handicap_index: null,
    handicap_visibility: null,
    eg_visible: false,
    has_active_whs_connection: false,
    feats: [],
    birdies: f.birdies ?? null,
    eagles: f.eagles ?? null,
    albatrosses: f.albatrosses ?? null,
    holes_in_one: f.holes_in_one ?? null,
    clean_card: f.clean_card ?? null,
    longest_birdie_run: null,
    longest_par_or_better_run: null,
    sub_80: null,
    ace_hole: null,
    albatross_hole: null,
    front_nine_to_par: null,
    back_nine_to_par: null,
    is_course_record: !!f.is_course_record,
    course_record_fact: null,
    is_first_sub_80: false,
    suggested: false,
    is_self: !!row.who?.is_viewer,
    delta_index: null,
    stableford_points: f.stableford ?? null,
  };
}

/** The review sheet reads this shape. Sub-scores are not in the stream row, so
 *  the breakdown is null rather than zeroed — a 0 would read as a rating. */
function reviewPayload(row: StreamRow): LatestReview | undefined {
  const f = row.facts;
  if (!f.review_id || !row.subject?.course_id) return undefined;
  return {
    reviewId: f.review_id,
    courseId: row.subject.course_id,
    courseName: row.subject.course_name ?? '',
    courseImage: row.subject.image_url ?? null,
    rating: f.rating ?? 0,
    quote: f.first_sentence ?? '',
    at: f.arrived_at ?? '',
    userId: row.who?.user_id ?? null,
    reviewerName: row.who?.display_name ?? '',
    reviewerUsername: null,
    reviewerAvatar: row.who?.photo_url ?? null,
    mediaUrl: null,
    mediaType: null,
    posterUrl: null,
    courseCountry: null,
    courseRegion: row.subject.region ?? null,
    courseSubCountry: row.subject.sub_country ?? null,
    breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
  };
}

function toItem(row: StreamRow): StreamItem {
  const payload: StreamPayload = {};
  if (row.kind === 'round') {
    const round = roundPayload(row);
    if (round) payload.round = round;
  }
  if (row.kind === 'review') {
    const review = reviewPayload(row);
    if (review) payload.review = review;
  }
  return {
    id: row.id,
    kind: row.kind,
    ring: row.ring,
    lane: row.lane,
    score: Number(row.score ?? 0),
    consequence: row.consequence ?? null,
    subject: row.subject ?? null,
    who: row.who ?? null,
    facts: row.facts ?? {},
    payload,
    seen: !!row.seen,
  };
}

/**
 * A FAILING VIEW MUST BE VISIBLE (AUDIT RULING 2).
 *
 * The D4 fallback is the reason `g.id` survived two ship reports and a device
 * check: the RPC errored, `unavailable` went true, the client composition took
 * over and the page looked perfect. Resilience without detection is how a dead
 * view stays dead. So the moment the error transitions to set we report it to
 * the SAME pipeline that carries app errors (trackError -> analytics_events
 * `app_error`, whose redaction, 10s dedupe and 5-per-session cap already stop
 * this flooding), and we mark the fact that a view is SERVING FROM FALLBACK as
 * its own reportable state.
 *
 * ONCE PER VIEW AND CODE. A retry: false query fails once per view per session,
 * but the hook remounts on every tab switch; the module-level sets below keep
 * one report per view/code and one fallback marker per view for the session.
 * They are module-level ON PURPOSE — a ref would reset with the component and
 * re-report on every visit.
 */
const reportedErrors = new Set<string>();
const reportedFallback = new Set<string>();

/** The PostgREST error code (`42703` for the undefined column that hid here). */
function pgCode(error: unknown): string {
  const e = error as { code?: string } | null;
  return e?.code ? String(e.code) : 'unknown';
}

function reportStreamFailure(
  view: ExploreView,
  scope: string,
  error: unknown,
): void {
  const code = pgCode(error);
  const key = `${view}|${code}`;
  if (!reportedErrors.has(key)) {
    reportedErrors.add(key);
    const e = error as { message?: string; details?: string; hint?: string } | null;
    trackError({
      kind: 'error',
      message: `get_explore_stream ${view} ${code}: ${e?.message ?? 'unknown'}`,
      stack: `explore_stream view=${view} scope=${scope} code=${code}`,
    });
  }
  if (!reportedFallback.has(view)) {
    reportedFallback.add(view);
    /* Running on the net is not a success. This event exists so "how many
       members were served the fallback today" is answerable at all. */
    analyticsEvents.track('amateur_stream_fallback_served', {
      view,
      scope,
      code,
    });
  }
}

export function useExploreStream(
  viewerId: string | undefined,
  view: ExploreView,
  scope: string,
  geography?: { clubId?: string | null; county?: string | null; country?: string | null },
): ExploreServerStream {
  const { t } = useTranslation('courses');
  const query = useInfiniteQuery<ExploreStreamPage>({
    queryKey: exploreKeys.stream(viewerId, view, scope, geography),
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    /* A missing function is a permanent failure this session, not a flake. */
    retry: false,
    initialPageParam: null as Record<string, unknown> | null,
    /* NEVER THROW ON AN UNEXPECTED PAGE. This function consumes CACHED data —
       restored from IndexedDB, written by an older version of this hook — so it
       must treat the page as untrusted input. An unreadable page stops
       pagination; it does not take the view down. */
    getNextPageParam: (last) => {
      if (!last || typeof last !== 'object') return undefined;
      const cursor = (last as { cursor?: unknown }).cursor;
      return cursor == null ? undefined : (cursor as Record<string, unknown>);
    },
    queryFn: async ({ pageParam }) => {
      /* The RPC is newer than src/integrations/supabase/types.ts (regenerated
         from the project, never hand-edited), so the name is cast at this one
         call site rather than the row shape being invented. */
      /* BOUND, DELIBERATELY. supabase.rpc reads `this.rest`; a cast expression
         called on its own drops the receiver and throws before any request is
         sent, which silently pushed this hook onto its client fallback for
         every member. `.call(supabase, ...)` keeps the receiver. */
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: StreamRow[] | null; error: unknown }>).call(supabase, 'get_explore_stream', {
        p_viewer: viewerId as string,
        p_view: view,
        p_scope: scope,
        p_cursor: pageParam ?? null,
        p_limit: STREAM_PAGE_SIZE,
        p_club_id: geography?.clubId ?? null,
        p_county: geography?.county ?? null,
        p_country: geography?.country ?? null,
      });
      if (error) throw error;
      const rows = data ?? [];
      return {
        items: rows.map(toItem),
        /* Every row carries the same cursor; the last one is the page boundary. */
        cursor: rows.length ? (rows[rows.length - 1].next_cursor ?? null) : null,
      };
    },
  });

  /* AUDIT RULING 2 — report the failure, once, when it transitions to set. */
  useEffect(() => {
    if (query.error) reportStreamFailure(view, scope, query.error);
  }, [query.error, view, scope]);



  /* THE COURSE SENTENCE, IN THE MEMBER'S LANGUAGE. Only added where the row is a
     course card and the server did not carry a headline of its own. */
  const items = useMemo(
    () =>
      (query.data?.pages ?? []).flatMap((p) => p.items).map((item) => {
        if (item.kind !== 'course' || item.facts.headline) return item;
        const headline = courseHeadline(t, {
          event: item.facts.course_event ?? 'stable',
          burstCount: item.facts.ratings_burst_n ?? null,
          burstMean: item.facts.ratings_burst_mean ?? null,
          lowGross: item.facts.low_gross ?? null,
          lowBy: item.facts.low_by ?? null,
          rounds: item.facts.rounds_tracked ?? null,
          rating: item.facts.rating ?? null,
          ratingCount: item.facts.rating_n ?? null,
        });
        return headline ? { ...item, facts: { ...item.facts, headline } } : item;
      }),
    [query.data, t],
  );
  return {
    items,
    total: items.length,
    isFetched: viewerId ? query.isFetched : true,
    isPending: !!viewerId && !query.isFetched,
    hasNextPage: !!query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
    unavailable: !!query.error,
  };
}
