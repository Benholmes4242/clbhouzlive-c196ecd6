/**
 * CB114 — ONE get_course_stats_batch over the hero's nearby course ids, under
 * ONE key, shared by BusinessYouCard and BusinessNearbyCourses (card + sheet)
 * so they make a single call between them. Order follows the input courses.
 * Rows are get_course_stats_detail rows; a wrapping column is tolerated (CB113).
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyCourseStat {
  id: string; name: string;
  your_rounds: number | null; your_best: number | null;
  avg_over_par: number | null; rounds_tracked: number | null;
}

export const nearbyCourseStatsKey = (viewerId: string | null | undefined, ids: string[]) =>
  ['nearby-course-stats', viewerId ?? null, ids] as const;

function unwrap(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  if ('course_id' in o) return o;
  const inner = Object.values(o).find((v) => v && typeof v === 'object' && 'course_id' in (v as object));
  return (inner as Record<string, unknown>) ?? null;
}

const num = (v: unknown) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));

export function useNearbyCourseStats(
  viewerId: string | null | undefined,
  courses: Array<{ id: string; name: string }>,
  enabled: boolean,
) {
  const ids = courses.map((c) => c.id);
  return useQuery({
    queryKey: nearbyCourseStatsKey(viewerId, ids),
    enabled: enabled && ids.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<NearbyCourseStat[]> => {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: unknown) => Promise<{ data: unknown; error: unknown }> })
        .rpc('get_course_stats_batch', { p_course_ids: ids });
      if (error) throw error;
      const byId = new Map<string, Record<string, unknown>>();
      for (const r of (Array.isArray(data) ? data : [])) { const u = unwrap(r); if (u) byId.set(String(u.course_id), u); }
      return courses.map((c) => {
        const r = byId.get(c.id);
        return {
          id: c.id, name: c.name,
          your_rounds: num(r?.your_rounds), your_best: num(r?.your_best),
          avg_over_par: num(r?.avg_over_par), rounds_tracked: num(r?.rounds_tracked),
        };
      });
    },
  });
}
