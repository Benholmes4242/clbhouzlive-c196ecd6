import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import type { BoardKey } from '../boardFilters';
import type { BoardPick, RotationRow } from '../boardRotation';
import { FALLBACK_PICK, persistPick, pickRotation, readLastPick } from '../boardRotation';

/**
 * THE ROTATED DRAW (BRIEF_DISCOVER_FIRST_VISIT_DEFAULT F2).
 *
 * Only LATER sessions of the same calendar day rotate; the day's first session
 * lands on the handicap default. The caller (useDiscoverEntryBoard) decides
 * which of the two a session is and enables this hook accordingly.
 *
 * The draw happens INSIDE the query function, which react-query runs exactly
 * once for an infinitely fresh key, so nothing about the pick is derived during
 * render and a remount never re-draws.
 */
export function useBoardRotation(
  viewerId: string | undefined,
  opts?: {
    enabled?: boolean;
    /** F2.3 — the member's handicap default board never wins the draw. */
    excludeBoard?: BoardKey | null;
    /** F2.7 / F5.3 — the silent fallback: the handicap default. */
    fallback?: BoardPick;
  },
) {
  const enabled = opts?.enabled ?? true;
  const fallback = opts?.fallback ?? FALLBACK_PICK;
  const excludeBoard = opts?.excludeBoard ?? null;

  const query = useQuery<BoardPick>({
    queryKey: ['discover', 'boardRotation', viewerId ?? 'anon', excludeBoard ?? 'none'],
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      /* F2.7 / F5.3 — a failed call is a fallback, not an error state. */
      const { data, error } = await supabase.rpc('get_board_rotation', {
        p_viewer: viewerId ?? null,
        p_min_rows: 6,
      });
      const pick = error
        ? fallback
        : pickRotation((data ?? []) as RotationRow[], {
            last: readLastPick(),
            excludeBoard,
            fallback,
          });
      persistPick(pick);
      return pick;
    },
  });

  return {
    pick: query.data ?? null,
    /* F5.2 — until this is true the board holds its loading state. There is no
       handicap-default render that is then swapped for the rotated board. */
    resolved: !!query.data,
  };
}
