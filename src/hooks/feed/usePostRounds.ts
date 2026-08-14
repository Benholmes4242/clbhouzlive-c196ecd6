/**
 * usePostRounds - BATCHED round data for the Clubhouse feed (C3).
 *
 * Exactly the same contract as usePostCourseContext: ONE query per feed page
 * for every visible post's round, keyed on the sorted de-duplicated id array,
 * called ONCE at page level in Clubhouse.tsx and passed down. A card must
 * NEVER fetch.
 *
 * Two hooks, two batched calls per page:
 *   usePostScoreIds(postIds)  -> Map<postId, whs_score_id>
 *   usePostRounds(scoreIds)   -> Map<whs_score_id, PostRound>
 *
 * The feed RPCs do not project posts.whs_score_id, so the id resolution is a
 * single `in (...)` read over the page's post ids rather than a per-card one.
 *
 * Hole shape: RENDER IF MOSTLY SCORED (BRIEF_ROUND_STRIP_PARTIAL_HOLES).
 * `holeShape` is non-null when at least one played hole carries a score AND at
 * least SCORED_FLOOR played holes do; the unscored played holes stay in the
 * shape with `gross: null` and the card marks them as gaps. The EMPTY case is
 * unchanged: a round where NO played hole has a score (a freshly synced round
 * of pars) still resolves to null and renders no strip, no nine totals and no
 * trajectory. Picking up on a hole is ordinary golf, so a partial card is
 * honest as long as any nine containing a gap refuses to print a total.

 * 18 rows of pars with no scores and resolve to null. RLS decides visibility;
 * a round the viewer may not read simply resolves to nothing and the post
 * renders as it did before C3.
 */
import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { batchDigest, feedKeys, viewerId } from '@/lib/queryKeys';
import { useMergedBatch } from '@/lib/batchQuery';

/** One hole of the round shape, ordered by hole_no. */
export interface PostRoundHole {
  holeNo: number;
  par: number | null;
  gross: number | null;
  /**
   * THE LINE'S VALUE: gross ?? adjusted_gross (BRIEF_TRAJECTORY_CONTINUITY §1.1).
   * NEVER PRINTED AS A SCORE. A picked-up hole has no gross but does have a
   * handicapping value, and the round's SHAPE — where it stood — is honest to
   * draw from it. Cells and nine totals read `gross`; only the trajectory reads
   * this. Null when adjusted_gross is absent too: the line breaks there.
   */
  lineGross: number | null;
  /**
   * BRIEF §1.4 — the shape keeps ALL EIGHTEEN positions, so the cell carries
   * its own state:
   *   played true,  gross present -> the score
   *   played true,  gross null    -> PICKED UP (started, did not hole out)
   *   played false                -> NOT PLAYED (never started it)
   */
  played: boolean;
}

export interface PostRound {
  whsScoreId: string;
  grossScore: number | null;
  coursePar: number | null;
  deltaIndex: number | null;
  playDate: string | null;
  birdies: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holesInOne: number | null;
  beatPar: boolean | null;
  cleanCard: boolean | null;
  slopeRating: number | null;
  longestBirdieRun: number | null;
  /** null when the round has no hole detail - render without the strip. */
  holeShape: PostRoundHole[] | null;
  /**
   * Present only when this round displaced a named previous holder
   * (get_round_crowns). null for every other round, including a crown held by
   * default because nobody else has played the course.
   */
  crown?: {
    category: string;
    previousHolderName: string;
    margin: number | null;
  } | null;
}

export type PostRoundMap = Map<string, PostRound>;
export type PostScoreIdMap = Map<string, string>;

/**
 * Both hooks return the Map as before — no callsite breaks on shape — with a
 * `settled` flag attached to it (BRIEF_CLUBHOUSE_ROUND_POP_IN §1). A DISABLED
 * query counts as SETTLED: a page with no posts, or no post carrying a score
 * id, is READY, not perpetually loading.
 */
export type PostRoundMapState = PostRoundMap & { readonly settled: boolean; readonly fetching: boolean };
export type PostScoreIdMapState = PostScoreIdMap & { readonly settled: boolean; readonly fetching: boolean };

function withSettled<M extends Map<string, unknown>>(
  map: M,
  settled: boolean,
  fetching: boolean,
): M & { settled: boolean; fetching: boolean } {
  return Object.assign(new Map(map) as M, { settled, fetching });
}

function stableIds(ids: (string | null | undefined)[]): string[] {
  const unique = Array.from(new Set(ids.filter((v): v is string => !!v)));
  unique.sort();
  return unique;
}

/**
 * Minimum PLAYED holes that must carry a score for the strip to render.
 *
 * NOT DERIVED. The production distribution cannot distinguish a floor of 4 from
 * a floor of 17: every affected round is missing either one to four holes or
 * all eighteen. 12 is "most of a round", chosen so a strip that is mostly gaps
 * can never render. Nothing in the data pins it.
 */
const SCORED_FLOOR = 12;

/**
 * The hole-strip gate (BRIEF_ROUND_STRIP_PARTIAL_HOLES §1).
 *
 * Returns the ordered PLAYED holes, gaps included (gross null), when:
 *   - a shape exists with at least one played hole, AND
 *   - at least one played hole carries a score (the EMPTY case still drops -
 *     BRIEF_ROUND_POST_EMPTY_SCORECARD stands for it), AND
 *   - at least SCORED_FLOOR played holes carry a score.
 *
 * played = false holes are KEPT (BRIEF §1.4): every hole is returned so the
 * strip renders eighteen cells with unbroken numbering, each marked by its own
 * state. Only PLAYED holes carrying a score count towards SCORED_FLOOR - a
 * not-played hole is not a gap. adjusted_gross is NEVER substituted into a cell;
 * it reaches `lineGross` only, for the trajectory.
 */
function renderableShape(
  shape: (PostRoundHole & { played: boolean })[] | null,
): PostRoundHole[] | null {
  if (!shape || shape.length === 0) return null;
  const playedHoles = shape.filter((h) => h.played);
  if (playedHoles.length === 0) return null;
  const scored = playedHoles.filter((h) => h.gross != null).length;
  if (scored === 0) return null;
  if (scored < Math.min(SCORED_FLOOR, playedHoles.length)) return null;
  return shape
    .slice()
    .sort((a, b) => a.holeNo - b.holeNo)
    .map(({ holeNo, par, gross, lineGross, played }) => ({ holeNo, par, gross, lineGross, played }));
}

/** Batched post_id -> whs_score_id for one feed page. */
export function usePostScoreIds(postIds: string[], scope: string): PostScoreIdMapState {
  const ids = useMemo(() => stableIds(postIds), [postIds]);
  const { user } = useSupabaseSession();
  const batch = useMergedBatch<string>();

  const query = useQuery({
    // BATCH IDIOM (src/lib/queryKeys.ts): scope + viewer + a DIGEST of the id
    // set. The digest is load-bearing: a count-keyed entry is reused when the
    // membership changes without the size changing (pull-to-refresh, a new post
    // at the top), and the new posts' score ids are then never requested.
    queryKey: feedKeys.postScoreIds(scope, viewerId(user?.id), batchDigest(ids)),

    placeholderData: keepPreviousData,
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PostScoreIdMap> => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, whs_score_id')
        .in('id', ids)
        .not('whs_score_id', 'is', null);
      if (error) throw error;
      const map: PostScoreIdMap = new Map();
      for (const row of (data ?? []) as { id: string; whs_score_id: string | null }[]) {
        if (row.whs_score_id) map.set(row.id, row.whs_score_id);
      }
      return batch.mergeOverPrevious(map);
    },
  });

  batch.commit(query.data);

  // Disabled (no post ids) => settled. Error => settled (isPending is false).
  // A NEXT-PAGE fetch is also settled: keepPreviousData means the map on screen
  // is still valid, so the page-level gate must not re-close mid-scroll.
  // `fetching` is the finer signal cards use for their own waiting state.
  const settled = ids.length === 0 || !query.isPending;
  const fetching = query.isFetching;
  return useMemo(
    () => withSettled(query.data ?? new Map<string, string>(), settled, fetching) as PostScoreIdMapState,
    [query.data, settled, fetching],
  );
}

/** Batched round stats + hole shape for one feed page. */
export function usePostRounds(scoreIds: string[], scope: string): PostRoundMapState {
  const ids = useMemo(() => stableIds(scoreIds), [scoreIds]);
  const { user } = useSupabaseSession();
  const batch = useMergedBatch<PostRound>();

  const query = useQuery({
    // BATCH IDIOM (src/lib/queryKeys.ts). Viewer-scoped: RLS decides which
    // rounds resolve, so the answer differs per identity. Keyed on a DIGEST of
    // the score-id set — see usePostScoreIds above for why a count is unsafe.
    queryKey: feedKeys.postRounds(scope, viewerId(user?.id), batchDigest(ids)),
    placeholderData: keepPreviousData,
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PostRoundMap> => {
      // Three reads for the whole page, run together: the round counters, the
      // hole-by-hole shape, and the crowns taken, all for the same score ids.
      const [statsRes, holesRes, crownsRes] = await Promise.all([
        supabase
          .from('gam_round_stats')
          .select(
            'whs_score_id, gross_score, course_par, delta_index, play_date, birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card, slope_rating, longest_birdie_run',
          )
          .in('whs_score_id', ids),
        supabase
          .from('whs_score_holes')
          .select('score_id, hole_no, par, actual_gross, adjusted_gross, played')
          .in('score_id', ids)
          .order('hole_no', { ascending: true }),
        supabase.rpc('get_round_crowns', { p_score_ids: ids }),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (holesRes.error) throw holesRes.error;
      if (crownsRes.error) throw crownsRes.error;

      // At most one row per score id; a round with no crown simply has no row.
      const crowns = new Map<
        string,
        { category: string; previousHolderName: string; margin: number | null }
      >();
      for (const c of (crownsRes.data ?? []) as {
        whs_score_id: string;
        category: string | null;
        previous_holder_name: string | null;
        margin: number | null;
      }[]) {
        const name = (c.previous_holder_name ?? '').trim();
        // The card requires a name: no name, no crown.
        if (!name || !c.category) continue;
        crowns.set(c.whs_score_id, {
          category: c.category,
          previousHolderName: name,
          margin: c.margin ?? null,
        });
      }

      const shapes = new Map<string, (PostRoundHole & { played: boolean })[]>();
      for (const h of (holesRes.data ?? []) as {
        score_id: string;
        hole_no: number;
        par: number | null;
        actual_gross: number | null;
        adjusted_gross: number | null;
        played: boolean | null;
      }[]) {
        const list = shapes.get(h.score_id) ?? [];
        list.push({
          holeNo: h.hole_no,
          par: h.par ?? null,
          gross: h.actual_gross ?? null,
          lineGross: h.actual_gross ?? h.adjusted_gross ?? null,
          played: h.played !== false,
        });
        shapes.set(h.score_id, list);
      }

      const map: PostRoundMap = new Map();
      for (const r of (statsRes.data ?? []) as Record<string, unknown>[]) {
        const id = r.whs_score_id as string;
        const shape = shapes.get(id) ?? null;
        map.set(id, {
          whsScoreId: id,
          grossScore: (r.gross_score as number | null) ?? null,
          coursePar: (r.course_par as number | null) ?? null,
          deltaIndex: (r.delta_index as number | null) ?? null,
          playDate: (r.play_date as string | null) ?? null,
          birdies: (r.birdies as number | null) ?? null,
          eagles: (r.eagles as number | null) ?? null,
          albatrosses: (r.albatrosses as number | null) ?? null,
          holesInOne: (r.holes_in_one as number | null) ?? null,
          beatPar: (r.beat_par as boolean | null) ?? null,
          cleanCard: (r.clean_card as boolean | null) ?? null,
          slopeRating: (r.slope_rating as number | null) ?? null,
          longestBirdieRun: (r.longest_birdie_run as number | null) ?? null,
          // RENDER IF MOSTLY SCORED: all eighteen positions kept, each cell
          // carrying its state (scored / picked up / not played). A round with
          // NO scored played hole still resolves to null (the empty case).
          holeShape: renderableShape(shape),
          crown: crowns.get(id) ?? null,
        });
      }
      // Merge over the previous map so rounds already on screen survive the
      // fetch triggered by a changed digest (keepPreviousData covers the paint,
      // this covers the rows the new request did not ask about).
      return batch.mergeOverPrevious(map);
    },
  });

  batch.commit(query.data);

  // Disabled (no score ids on the page) => settled, so a feed of pure photo
  // posts is never held back by a query that will never run. A next-page fetch
  // is settled too — keepPreviousData keeps the rendered rounds valid.
  const settled = ids.length === 0 || !query.isPending;
  const fetching = query.isFetching;
  return useMemo(
    () => withSettled(query.data ?? new Map<string, PostRound>(), settled, fetching) as PostRoundMapState,
    [query.data, settled, fetching],
  );
}
