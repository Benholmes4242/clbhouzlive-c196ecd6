import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/**
 * WHO PLAYED THERE — LAZY, AND NOW ONLY A FACE PILE (BRIEF_COURSES_HOW_THEY_PLAYED
 * S3.2). The twelve-row member list is gone; this same read, with the same
 * arguments and the same lazy-on-expand behaviour, feeds the compact avatar stack
 * beside the low-round sentence instead.
 *
 * NO BOARD KEY: scope, window, band and competition only, taken field by field
 * from the page's filter state so a board key cannot ride in.
 */

export interface BoardCoursePlayer {
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  rounds: number;
  /** NULL when the member's rounds there carry no usable par. */
  best_gross: number | null;
  best_to_par: number | null;
  last_played: string | null;
}

export function useBoardCoursePlayers(
  viewerId: string | undefined,
  courseId: string | null,
  filters: BoardFilters,
  options?: { limit?: number; enabled?: boolean },
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
    enabled: (options?.enabled ?? true) && !!courseId,
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
