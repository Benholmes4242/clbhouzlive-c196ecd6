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
 * Hole shape: about 5% of rounds have no hole detail. Those return
 * `holeShape: null` so the card renders without the strip instead of a broken
 * chart. RLS decides visibility; a round the viewer may not read simply
 * resolves to nothing and the post renders as it did before C3.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** One hole of the round shape, ordered by hole_no. */
export interface PostRoundHole {
  holeNo: number;
  par: number | null;
  gross: number | null;
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
}

export type PostRoundMap = Map<string, PostRound>;
export type PostScoreIdMap = Map<string, string>;

const EMPTY_ROUNDS: PostRoundMap = new Map();
const EMPTY_SCORE_IDS: PostScoreIdMap = new Map();

function stableIds(ids: (string | null | undefined)[]): string[] {
  const unique = Array.from(new Set(ids.filter((v): v is string => !!v)));
  unique.sort();
  return unique;
}

/** Batched post_id -> whs_score_id for one feed page. */
export function usePostScoreIds(postIds: string[]): PostScoreIdMap {
  const ids = useMemo(() => stableIds(postIds), [postIds]);

  const query = useQuery({
    queryKey: ['post-score-ids', ids],
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
      return map;
    },
  });

  return query.data ?? EMPTY_SCORE_IDS;
}

/** Batched round stats + hole shape for one feed page. */
export function usePostRounds(scoreIds: string[]): PostRoundMap {
  const ids = useMemo(() => stableIds(scoreIds), [scoreIds]);

  const query = useQuery({
    queryKey: ['post-rounds', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PostRoundMap> => {
      // Two reads for the whole page, run together: the round counters and
      // the hole-by-hole shape for the same set of score ids.
      const [statsRes, holesRes] = await Promise.all([
        supabase
          .from('gam_round_stats')
          .select(
            'whs_score_id, gross_score, course_par, delta_index, play_date, birdies, eagles, albatrosses, holes_in_one, beat_par, clean_card',
          )
          .in('whs_score_id', ids),
        supabase
          .from('whs_score_holes')
          .select('score_id, hole_no, par, actual_gross')
          .in('score_id', ids)
          .order('hole_no', { ascending: true }),
      ]);

      if (statsRes.error) throw statsRes.error;
      if (holesRes.error) throw holesRes.error;

      const shapes = new Map<string, PostRoundHole[]>();
      for (const h of (holesRes.data ?? []) as {
        score_id: string;
        hole_no: number;
        par: number | null;
        actual_gross: number | null;
      }[]) {
        const list = shapes.get(h.score_id) ?? [];
        list.push({ holeNo: h.hole_no, par: h.par ?? null, gross: h.actual_gross ?? null });
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
          // Sorted defensively: the `.order` above covers the query, this
          // covers the grouping.
          holeShape:
            shape && shape.length > 0
              ? [...shape].sort((a, b) => a.holeNo - b.holeNo)
              : null,
        });
      }
      return map;
    },
  });

  return query.data ?? EMPTY_ROUNDS;
}
