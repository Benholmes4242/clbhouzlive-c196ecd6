/**
 * useMyCourseBests — the signed-in member's best 18-hole gross across MANY courses.
 *
 * Batched sibling of useMyCourseBest (which stays as-is for Course of the Week).
 * Backed by get_my_course_bests(p_course_ids uuid[]), which returns NO ROW for a
 * course the member has never played (HAVING COUNT(*) > 0) — so a course absent
 * from the returned map means "never played there", never zeros.
 *
 * ONE CALL PER WINDOW: the key is the SORTED, DEDUPED id set, so two orderings
 * of the same visible window share one cache entry and one round-trip.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MyCourseBestRow {
  course_id: string;
  best_gross: number | null;
  best_to_par: number | null;
  rounds_here: number | null;
  last_played: string | null;
}

export function useMyCourseBests(
  courseIds: (string | null | undefined)[],
  viewerId?: string | null,
) {
  const ids = useMemo(
    () => Array.from(new Set(courseIds.filter((id): id is string => !!id))).sort(),
    [courseIds],
  );

  const query = useQuery<Map<string, MyCourseBestRow>>({
    queryKey: ['my-course-bests', viewerId ?? null, ids],
    enabled: ids.length > 0 && !!viewerId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_course_bests' as never, {
        p_course_ids: ids,
      } as never);
      // Signed out / no rows / RPC failure all resolve to "no cells".
      if (error) return new Map();
      const rows = (Array.isArray(data) ? data : []) as MyCourseBestRow[];
      const map = new Map<string, MyCourseBestRow>();
      for (const row of rows) {
        if (row?.course_id) map.set(row.course_id, row);
      }
      return map;
    },
  });

  return query.data ?? EMPTY;
}

const EMPTY: Map<string, MyCourseBestRow> = new Map();
