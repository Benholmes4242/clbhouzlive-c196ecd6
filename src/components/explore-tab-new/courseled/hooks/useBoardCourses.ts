import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/**
 * COURSES PLAYED — THE "WHERE" READ (BRIEF_DISCOVER_COURSES_SECTION).
 *
 * THE BOARD KEY IS NOT A PARAMETER OF THIS RPC, DELIBERATELY (C2.2). The args are
 * built FIELD BY FIELD from BoardFilters — never spread from a wider object — so
 * a board key sitting beside the filter state in a caller cannot ride in. Where
 * members are playing is not a function of which leaderboard is on screen.
 */

export interface BoardCourseRow {
  course_id: string;
  name: string | null;
  area: string | null;
  thumbnail_image: string | null;
  rounds: number;
  members: number;
  plays_to: number | null;
  /** NULL at the All time window: there is no previous period (C4.3). */
  prev_rounds: number | null;
  is_new: boolean;
  total_courses: number;
}

export interface BoardCourses {
  rows: BoardCourseRow[];
  /** The RPC's full count BEFORE p_limit. */
  total: number;
}

/** C2.1 — the page's current filter state, explicitly, with NO board key. */
export function boardCoursesArgs(viewerId: string | undefined, f: BoardFilters) {
  return {
    p_viewer: viewerId ?? null,
    p_scope: f.scope,
    p_window: f.window,
    p_region_kind: f.regionKind,
    p_region_value: f.regionValue,
    p_courses: f.courses,
    p_course_id: f.courseId,
    p_band: f.band,
    p_competition: f.competition,
  };
}

export function useBoardCourses(
  viewerId: string | undefined,
  filters: BoardFilters,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 6;
  const args = boardCoursesArgs(viewerId, filters);

  return useQuery<BoardCourses>({
    queryKey: ['discover', 'board-courses', args, limit],
    /* C2.3 — a single-course filter answers "where" already; the section hides. */
    enabled: (options?.enabled ?? true) && filters.courses !== 'one',
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_board_courses' as never, {
        ...args,
        p_limit: limit,
      } as never);
      if (error) throw error;
      const raw = ((data ?? []) as unknown) as Array<Record<string, unknown>>;
      const rows: BoardCourseRow[] = raw.map((r) => ({
        course_id: String(r.course_id),
        name: (r.name as string | null) ?? null,
        area: (r.area as string | null) ?? null,
        thumbnail_image: (r.thumbnail_image as string | null) ?? null,
        rounds: Number(r.rounds ?? 0),
        members: Number(r.members ?? 0),
        plays_to: r.plays_to == null ? null : Number(r.plays_to),
        prev_rounds: r.prev_rounds == null ? null : Number(r.prev_rounds),
        is_new: r.is_new === true,
        total_courses: Number(r.total_courses ?? 0),
      }));
      return { rows, total: rows.length > 0 ? rows[0].total_courses : 0 };
    },
  });
}
