import { useInfiniteQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import type { LatestReview } from '@/components/explore-tab-new/courseled/hooks/useLatestReviews';

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
 * THE SERVER RANKER (BRIEF_EXPLORE_MAGAZINE PHASE D1).
 *
 * One RPC ranks the whole eligible universe and hands back one page plus an
 * opaque keyset cursor, so the page no longer ends where a fetched pool ends.
 * The draft SQL is docs/sql/explore_stream_d1.sql and is Ben's to run; the
 * local PG16 harness (scripts/explore-d1-harness.sh) proves rank fidelity, no
 * duplicate/skip across five pages, cadence across page seams, and a full cold
 * member page.
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

export function useExploreStream(
  viewerId: string | undefined,
  view: ExploreView,
  scope: string,
  geography?: { clubId?: string | null; county?: string | null; country?: string | null },
): ExploreServerStream {
  const query = useInfiniteQuery<ExploreStreamPage>({
    queryKey: exploreKeys.stream(viewerId, view, scope),
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    /* A missing function is a permanent failure this session, not a flake. */
    retry: false,
    initialPageParam: null as Record<string, unknown> | null,
    getNextPageParam: (last) => last.cursor ?? undefined,
    queryFn: async ({ pageParam }) => {
      /* The RPC is newer than src/integrations/supabase/types.ts (regenerated
         from the project, never hand-edited), so the name is cast at this one
         call site rather than the row shape being invented. */
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: StreamRow[] | null; error: unknown }>)('get_explore_stream', {
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

  const items = (query.data?.pages ?? []).flatMap((p) => p.items);
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
