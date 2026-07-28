import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Top 100 movers — "opinion is moving".
 *
 * Uses the existing get_top100_course_movers RPC. That RPC does not return
 * the current average or the rating count, so both are joined on afterwards
 * from course_rating_aggregates in a single batched query rather than adding
 * a new RPC.
 *
 * The RPC's supported ranges are this_week / this_month / (anything else =
 * this year), so the UI exposes the two that read as an editorial window.
 */

export type MoverRange = 'this_month' | 'this_year';

export interface Top100Mover {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  thumbnail_url: string | null;
  list_slug: string | null;
  rating_delta: number;
  plays_delta: number;
  avg_rating: number | null;
  rating_count: number;
}

/** A move of less than this is noise, not an opinion shift. */
const MIN_DELTA = 0.1;

export function useTop100Movers(range: MoverRange, scope = 'worldwide') {
  return useQuery({
    queryKey: ['top100-movers', range, scope],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Top100Mover[]> => {
      const { data, error } = await supabase.rpc('get_top100_course_movers', {
        scope_param: scope,
        time_range_param: range === 'this_month' ? 'this_month' : 'this_year',
        limit_param: 25,
      });
      if (error) throw error;

      const rows = ((data ?? []) as any[])
        .map((r) => ({
          course_id: r.course_id as string,
          course_name: r.course_name as string,
          country: (r.country ?? null) as string | null,
          sub_country: (r.sub_country ?? null) as string | null,
          thumbnail_url: (r.thumbnail_url ?? null) as string | null,
          list_slug: (r.list_slug ?? null) as string | null,
          rating_delta: Number(r.rating_delta ?? 0),
          plays_delta: Number(r.plays_delta ?? 0),
          avg_rating: null as number | null,
          rating_count: 0,
        }))
        .filter((r) => Math.abs(r.rating_delta) >= MIN_DELTA);

      if (rows.length === 0) return [];

      const { data: aggs, error: aggError } = await supabase
        .from('course_rating_aggregates' as any)
        .select('course_id, avg_overall_score, review_count')
        .in('course_id', rows.map((r) => r.course_id));
      if (aggError) throw aggError;

      const aggMap = new Map<string, { avg: number | null; count: number }>();
      for (const a of (aggs ?? []) as any[]) {
        aggMap.set(a.course_id, {
          avg: a.avg_overall_score != null ? Number(a.avg_overall_score) : null,
          count: Number(a.review_count ?? 0),
        });
      }

      for (const row of rows) {
        const agg = aggMap.get(row.course_id);
        row.avg_rating = agg?.avg ?? null;
        row.rating_count = agg?.count ?? 0;
      }

      // Biggest movement in either direction leads.
      rows.sort((a, b) => Math.abs(b.rating_delta) - Math.abs(a.rating_delta));
      return rows;
    },
  });
}
