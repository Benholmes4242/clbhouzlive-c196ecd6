import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * WHERE THE VIEWER STANDS (BRIEF_EXPLORE_MAGAZINE §2, PHASE B1).
 *
 * One row per course the viewer has played: their rank on that course's lowest
 * gross board now, and their rank as it stood at their last look at Discover.
 * The rank logic lives in public.get_viewer_standing, which reuses board_pool,
 * board_qualifies and get_board_page's collapse/tiebreak verbatim so this shelf
 * and the course Champions tab cannot disagree. The draft SQL is in
 * docs/sql/get_viewer_standing.sql and is Ben's to run.
 *
 * VIEWER ID IS IN THE KEY. This is an answer about one member and a disabled
 * read is still a cache read.
 *
 * UNRESOLVED IS NOT ABSENT. Until the function exists on the project the read
 * errors; `unresolved` is then true, `rows` is empty and the caller renders
 * NOTHING — never a shelf with zero tiles, and never "of 0". Readiness is
 * isFetched, never isLoading: a disabled query reports isLoading false and
 * would declare the page ready before anything had been asked for.
 */

export interface StandingRow {
  course_id: string;
  course_name: string | null;
  region: string | null;
  sub_country: string | null;
  image_url: string | null;
  rank_now: number;
  field_now: number;
  /** NULL on a first-ever visit, or where the board had no qualifying round at
   *  or before the stamp. NULL means no reference, so no movement chip. */
  rank_then: number | null;
  /** rank_then - rank_now. Positive = moved up. NULL when there is no
   *  reference; 0 means the board did not move and also draws no chip. */
  delta: number | null;
  last_change_at: string | null;
  /** Which board this rank is. 'topar' is the lowest gross board. */
  board: string;
}

export interface ViewerStanding {
  rows: StandingRow[];
  /** The REAL total, which is rows.length here: the RPC is not paged. */
  total: number;
  isFetched: boolean;
  unresolved: boolean;
}

const EMPTY: StandingRow[] = [];

export function useViewerStanding(viewerId: string | undefined): ViewerStanding {
  const query = useQuery<StandingRow[]>({
    queryKey: ['explore-magazine', 'viewer-standing', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    /* A missing function is a permanent failure this session, not a flake. */
    retry: false,
    queryFn: async () => {
      /* The RPC is newer than src/integrations/supabase/types.ts (that file is
         regenerated from the project and is never hand-edited), so the name is
         cast at this one call site rather than the row shape being invented. */
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: StandingRow[] | null; error: unknown }>)('get_viewer_standing', {
        p_viewer: viewerId as string,
      });
      if (error) throw error;
      return (data ?? []) as StandingRow[];
    },
  });

  const rows = query.data ?? EMPTY;
  return {
    rows,
    total: rows.length,
    isFetched: viewerId ? query.isFetched : true,
    unresolved: !!query.error,
  };
}
