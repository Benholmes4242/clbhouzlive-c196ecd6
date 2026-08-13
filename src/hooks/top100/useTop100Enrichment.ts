import { useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { batchDigest, top100Keys, viewerId } from '@/lib/queryKeys';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batched enrichment for the Top 100 list.
 *
 * The brief forbids per-card fetching, so this mirrors what
 * `usePostCourseContext` does for the Clubhouse feed: one query per source,
 * keyed on the whole id set, results handed to the list as a Map.
 *
 * Sources (all pre-existing, nothing new was added):
 *  - course_rating_aggregates      member rating + rating count
 *  - get_post_course_context RPC   rounds tracked, avg over par, your rounds
 *  - course_ratings                which of these the viewer has rated
 */

export interface Top100Enrichment {
  courseId: string;
  rating: number | null;
  ratingCount: number;
  roundsTracked: number;
  avgOverPar: number | null;
  yourRounds: number;
  yourBest: number | null;
  ratedByYou: boolean;
  harderThanPct: number | null;
  /** Rating sub-scores, straight from course_rating_aggregates. */
  subScores: {
    design: number | null;
    condition: number | null;
    facilities: number | null;
    clubhouse: number | null;
  };
}

const EMPTY = new Map<string, Top100Enrichment>();

/**
 * QUERY KEY CONTRACT — do not key on the id set.
 *
 * The old key hashed the whole loaded id array. Every pagination page produced
 * a brand-new key, so `data` went undefined for one paint and EVERY rendered
 * enrichment block unmounted, collapsing rows above the viewport by 118-162px
 * each. The key is now a STABLE SCOPE (list slug / search term, supplied by the
 * caller) plus the viewer id, with the loaded count as a monotonic page marker
 * and `keepPreviousData` so already-fetched rows never blank out mid-scroll.
 * Results are merged over the previous map, so values only ever get added.
 */
export function useTop100Enrichment(
  courseIds: string[],
  userId: string | undefined,
  /** Stable scope: the active list slug, plus any filter that changes the set. */
  scopeKey: string = 'default',
) {
  const enabled = courseIds.length > 0;
  const previousRef = useRef<Map<string, Top100Enrichment>>(EMPTY);

  const { data } = useQuery({
    // BATCH IDIOM: keyed on a DIGEST of the sorted, de-duplicated id set — a
    // count-keyed entry is reused when the membership changes without the size
    // changing, and the new ids are then never requested.
    queryKey: top100Keys.enrichment(
      scopeKey,
      viewerId(userId),
      batchDigest(Array.from(new Set(courseIds.filter(Boolean))).sort()),
    ),
    placeholderData: keepPreviousData,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Map<string, Top100Enrichment>> => {
      const ids = courseIds;

      const [aggRes, ctxRes, mineRes] = await Promise.all([
        supabase
          .from('course_rating_aggregates' as any)
          .select('course_id, avg_overall_score, review_count, avg_design_score, avg_condition_score, avg_facilities_score, avg_clubhouse_score')
          .in('course_id', ids),
        supabase.rpc('get_post_course_context', { p_course_ids: ids }),
        userId
          ? supabase
              .from('course_ratings')
              .select('course_id')
              .eq('user_id', userId)
              .in('course_id', ids)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (aggRes.error) throw aggRes.error;
      if (ctxRes.error) throw ctxRes.error;
      if (mineRes.error) throw mineRes.error;

      const map = new Map<string, Top100Enrichment>();
      for (const id of ids) {
        map.set(id, {
          courseId: id,
          rating: null,
          ratingCount: 0,
          roundsTracked: 0,
          avgOverPar: null,
          yourRounds: 0,
          yourBest: null,
          ratedByYou: false,
          harderThanPct: null,
          subScores: { design: null, condition: null, facilities: null, clubhouse: null },
        });
      }

      for (const row of (aggRes.data ?? []) as any[]) {
        const entry = map.get(row.course_id);
        if (!entry) continue;
        entry.rating = row.avg_overall_score != null ? Number(row.avg_overall_score) : null;
        entry.ratingCount = Number(row.review_count ?? 0);
        const num = (v: unknown) => (v != null ? Number(v) : null);
        entry.subScores = {
          design: num(row.avg_design_score),
          condition: num(row.avg_condition_score),
          facilities: num(row.avg_facilities_score),
          clubhouse: num(row.avg_clubhouse_score),
        };
      }

      for (const row of (ctxRes.data ?? []) as any[]) {
        const entry = map.get(row.course_id);
        if (!entry) continue;
        entry.roundsTracked = Number(row.rounds_tracked ?? 0);
        entry.avgOverPar = row.avg_over_par != null ? Number(row.avg_over_par) : null;
        entry.yourRounds = Number(row.your_rounds ?? 0);
        entry.yourBest = row.your_best != null ? Number(row.your_best) : null;
        entry.harderThanPct = row.harder_than_pct != null ? Number(row.harder_than_pct) : null;
      }

      for (const row of (mineRes.data ?? []) as any[]) {
        const entry = map.get(row.course_id);
        if (entry) entry.ratedByYou = true;
      }

      // Merge over what we already had: a row that has a block keeps it.
      const merged = new Map(previousRef.current);
      map.forEach((value, id) => merged.set(id, value));
      return merged;
    },
  });

  if (data && data !== previousRef.current) previousRef.current = data;

  return data ?? EMPTY;
}
