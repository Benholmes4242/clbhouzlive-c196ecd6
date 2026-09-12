import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE VIEWER'S OWN BEST GROSS AT EACH COURSE (BRIEF_EXPLORE_MAGAZINE §3b).
 *
 * Needed to answer "did this round pass me?": another member's round moves the
 * viewer DOWN a board only if it is better than the viewer's own best there.
 *
 * WHAT THIS IS NOT. It is not a rank and it is not a field size. Every rank and
 * every "of {n}" in a headline is read from get_viewer_standing, so the shelf
 * and the sentence on the same page cannot disagree (B1 ruling). This map only
 * decides WHETHER a round passed the viewer, never WHERE they now sit.
 *
 * ID SPACE: gam_round_stats.course_id is the golf_courses id space — 3,546 of
 * 3,554 rows join golf_courses.id and 0 join whs_to_golf_course_map. NO WHS
 * bridge on this path (B1 correction, carried forward).
 *
 * 18 HOLES ONLY, the same predicate board_pool() applies, so a nine-hole round
 * cannot silently become the viewer's "best" on an 18-hole board.
 */

export interface ViewerCourseBests {
  /** course_id -> lowest 18-hole gross the viewer has recorded there. */
  bests: Map<string, number>;
  isFetched: boolean;
}

const EMPTY = new Map<string, number>();

export function useViewerCourseBests(viewerId: string | undefined): ViewerCourseBests {
  const query = useQuery<Map<string, number>>({
    queryKey: ['explore-magazine', 'viewer-course-bests', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gam_round_stats' as never)
        .select('course_id, gross_score')
        .eq('user_id', viewerId as string)
        .eq('holes_played', 18);
      if (error) throw error;
      const out = new Map<string, number>();
      for (const row of ((data ?? []) as unknown as Array<{ course_id: string | null; gross_score: number | null }>)) {
        if (!row.course_id || row.gross_score == null) continue;
        const current = out.get(row.course_id);
        if (current == null || row.gross_score < current) out.set(row.course_id, row.gross_score);
      }
      return out;
    },
  });

  return {
    bests: query.data ?? EMPTY,
    isFetched: viewerId ? query.isFetched : true,
  };
}
