import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/**
 * WHO PLAYED THERE (BRIEF_DISCOVER_COURSES_SECTION C5.2) — LAZY. This read only
 * ever fires for the ONE open row: eight courses at a fortnight is nothing, but
 * 254 at All time is, and prefetching every row would pay that cost for a panel
 * nobody opened.
 *
 * Again NO BOARD KEY (C2.2): scope, window, band and competition only, taken
 * field by field from the page's filter state.
 */

export interface BoardCoursePlayer {
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  rounds: number;
  /** NULL when the member's rounds there carry no usable par (C5.4). */
  best_gross: number | null;
  best_to_par: number | null;
  last_played: string | null;
}

export function useBoardCoursePlayers(
  viewerId: string | undefined,
  courseId: string | null,
  filters: BoardFilters,
  options?: { limit?: number },
) {
  const limit = options?.limit ?? 12;
  const args = {
    p_viewer: viewerId ?? null,
    p_course_id: courseId,
    p_scope: filters.scope,
    p_window: filters.window,
    p_band: filters.band,
    p_competition: filters.competition,
  };

  return useQuery<BoardCoursePlayer[]>({
    queryKey: ['discover', 'board-course-players', args, limit],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_board_course_players' as never, {
        ...args,
        p_limit: limit,
      } as never);
      if (error) throw error;
      const raw = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
      return raw.map((r) => ({
        user_id: String(r.user_id),
        display_name: (r.display_name as string | null) ?? null,
        profile_photo_url: (r.profile_photo_url as string | null) ?? null,
        rounds: Number(r.rounds ?? 0),
        best_gross: r.best_gross == null ? null : Number(r.best_gross),
        best_to_par: r.best_to_par == null ? null : Number(r.best_to_par),
        last_played: (r.last_played as string | null) ?? null,
      }));
    },
  });
}
