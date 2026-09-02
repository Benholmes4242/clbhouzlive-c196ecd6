import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { supabase } from '@/integrations/supabase/client';

import type { BoardPick, RotationRow } from '../boardRotation';
import {
  FALLBACK_PICK,
  persistPick,
  pickRotation,
  readLastPick,
  readSessionPick,
} from '../boardRotation';

/**
 * DISCOVER'S LANDING COMBINATION (BRIEF_DISCOVER_BOARD_ROTATION R1).
 *
 * ONCE PER SESSION. The session's pick is read synchronously on first render,
 * so a remount — and refetchOnMount is on app-wide — never re-draws. The RPC is
 * only called when sessionStorage holds nothing, and the draw happens inside the
 * query function, which react-query runs exactly once for an infinitely fresh
 * key. Nothing about the pick is derived during render.
 */
export function useBoardRotation(viewerId: string | undefined) {
  /* Read ONCE, on mount, and keep it: a later session write must not make this
     component re-derive anything. */
  const [sessionPick] = useState<BoardPick | null>(() => readSessionPick());

  const query = useQuery<BoardPick>({
    queryKey: ['discover', 'boardRotation', viewerId ?? 'anon'],
    enabled: !sessionPick,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async () => {
      /* R3.1 — a failed call is a fallback, not an error state. */
      const { data, error } = await supabase.rpc('get_board_rotation', {
        p_viewer: viewerId ?? null,
        p_min_rows: 6,
      });
      const pick = error
        ? FALLBACK_PICK
        : pickRotation((data ?? []) as RotationRow[], { last: readLastPick() });
      persistPick(pick);
      return pick;
    },
  });

  const pick = sessionPick ?? query.data ?? null;

  return {
    pick,
    /* R3.2 — until this is true the board shows its loading state. There is no
       gross/14 render that is then replaced by the rotated pick. */
    resolved: !!pick,
  };
}
