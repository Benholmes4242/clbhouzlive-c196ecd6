import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import {
  DEFAULT_STANDING_BOARD,
  STANDING_BOARDS,
  isStandingBoard,
  type StandingBoard,
} from './standingBoard';

/**
 * WHICH BOARDS THIS MEMBER ACTUALLY HAS (Ben's ruling: no greyed options).
 *
 * public.get_viewer_standing_boards(uuid) answers, for all five boards in one
 * read, how many of the viewer's courses have the viewer qualifying AND a
 * qualified field of at least 2. A board with none is not offered - not
 * disabled, not there. Drafted in docs/sql/get_viewer_standing_boards_five.sql
 * and Ben's to run.
 *
 * UNTIL THE FUNCTION EXISTS, THE SHELF KEEPS TODAY'S TWO OPTIONS. An errored
 * availability read must not empty the dropdown or hide the shelf, so the
 * fallback is exactly what is deployed and working now: net and gross. It is
 * NOT all five, because offering a board that returns nothing is the "1st of 1"
 * fault in another costume.
 *
 * THE DEFAULT MUST BE OFFERED OR REPLACED. If net has no course for this member
 * the first available board becomes the effective default, so the shelf never
 * asks for a board it has just said the member does not have.
 */

const FALLBACK: readonly StandingBoard[] = ['net', 'topar'] as const;

export interface StandingBoardsAvailability {
  /** In STANDING_BOARDS order, so the menu order never depends on the server. */
  boards: readonly StandingBoard[];
  /** Course count per available board, for reporting and analytics only. */
  counts: Readonly<Partial<Record<StandingBoard, number>>>;
  isFetched: boolean;
  /** True when the read failed and `boards` is the deployed-today fallback. */
  fellBack: boolean;
}

export function useStandingBoards(viewerId: string | undefined): StandingBoardsAvailability {
  const query = useQuery<Partial<Record<StandingBoard, number>>>({
    queryKey: ['explore-magazine', 'standing-boards', viewerId ?? 'anon'],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    /* A missing function is a permanent failure this session, not a flake. */
    retry: false,
    queryFn: async () => {
      /* THE CALL MUST STAY BOUND TO THE CLIENT: supabase.rpc reads `this.rest`,
         and a bare local reference throws before any request is made. That was
         the fault that emptied this shelf once already. */
      const { data, error } = await (supabase.rpc as unknown as (
        f: string,
        a: Record<string, unknown>,
      ) => Promise<{ data: { board: string; courses: number }[] | null; error: unknown }>).call(
        supabase,
        'get_viewer_standing_boards',
        { p_viewer: viewerId as string },
      );
      if (error) throw error;
      const counts: Partial<Record<StandingBoard, number>> = {};
      for (const row of data ?? []) {
        if (isStandingBoard(row.board) && Number(row.courses) > 0) {
          counts[row.board] = Number(row.courses);
        }
      }
      return counts;
    },
  });

  const counts = query.data ?? {};
  const fellBack = !!query.error || !viewerId;
  const available = fellBack
    ? FALLBACK
    : STANDING_BOARDS.filter((b) => (counts[b] ?? 0) > 0);

  return {
    boards: available.length > 0 ? available : FALLBACK,
    counts,
    isFetched: viewerId ? query.isFetched : true,
    fellBack,
  };
}

/** The board to ask for: the remembered one when it is offered, else the first
 *  offered board, else the default. Never a board the member does not have. */
export function effectiveStandingBoard(
  remembered: StandingBoard,
  available: readonly StandingBoard[],
): StandingBoard {
  if (available.includes(remembered)) return remembered;
  return available[0] ?? DEFAULT_STANDING_BOARD;
}
