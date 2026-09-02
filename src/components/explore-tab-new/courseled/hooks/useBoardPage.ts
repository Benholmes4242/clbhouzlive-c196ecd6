import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters, BoardKey } from '../boardFilters';

/**
 * THE BOARD'S ONE READ (BRIEF_DISCOVER_FILTER_LED_BOARD S1).
 *
 * RANKING IS THE DATABASE'S JOB. public.get_board_page returns the page ALREADY
 * ORDERED, already deduped one row per member where that applies, with `pos`,
 * `is_tie` and a `total_count` on every row. There is no client-side sort, no
 * client-side dedupe and NO CLIENT-SIDE CAP: the only limit is p_limit
 * (S1.1/S1.3). The old GOLF_WEEK_FETCH = 120 made any window wider than a
 * fortnight silently mean "the most recent 120 rounds".
 *
 * THE RANK COLUMN IS `pos`, NOT `position` (S1.2) — `position` is reserved in
 * Postgres. It is never aliased back.
 *
 * ARGUMENTS ARE NAMED, never positional nulls (S1.6).
 */

export interface BoardRow {
  pos: number;
  is_tie: boolean;
  user_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  whs_score_id: string | null;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  gross_score: number | null;
  course_par: number | null;
  net_score: number | null;
  stableford_points: number | null;
  delta_index: number | null;
  birdies: number | null;
  holes_in_one: number | null;
  albatrosses: number | null;
  eagles: number | null;
  clean_card: boolean | null;
  beat_par: boolean | null;
  sub_80: boolean | null;
  hcp_at_time: number | null;
  sort_value: number | null;
  total_count: number;
}

export function boardRpcArgs(
  viewerId: string | undefined,
  board: BoardKey,
  f: BoardFilters,
) {
  return {
    p_viewer: viewerId ?? null,
    p_board: board,
    p_scope: f.scope,
    p_window: f.window,
    p_region_kind: f.regionKind,
    p_region_value: f.regionValue,
    p_courses: f.courses,
    p_course_id: f.courseId,
    p_band: f.band,
    /* B0 — p_feat IS GONE from the RPC; p_competition sits in its place. */
    p_competition: f.competition,
  };
}

export interface BoardPage {
  rows: BoardRow[];
  /** The RPC's own total for the WHOLE board, not the page. */
  total: number;
}

export function useBoardPage(
  viewerId: string | undefined,
  board: BoardKey,
  filters: BoardFilters,
  options?: { limit?: number; offset?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 200;
  const offset = options?.offset ?? 0;
  const args = boardRpcArgs(viewerId, board, filters);

  return useQuery<BoardPage>({
    queryKey: ['discover', 'board-page', args, limit, offset],
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_board_page' as never, {
        ...args,
        p_limit: limit,
        p_offset: offset,
      } as never);
      if (error) throw error;
      const rows = ((data ?? []) as unknown) as BoardRow[];
      return { rows, total: rows.length > 0 ? Number(rows[0].total_count) : 0 };
    },
  });
}
