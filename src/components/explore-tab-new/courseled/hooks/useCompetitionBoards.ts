import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoardFilters } from '../boardFilters';

/** CB2: ONE call to the deployed `get_competition_boards`, which owns selection
 * and order. Scope follows the page; window fixed at '30'. p_podium 100 brings
 * the whole field with the cards: the card shows the first three, the field
 * sheet shows every row of the same result, so the two cannot disagree. */
export interface CompetitionBoardRow {
  comp_date: string;
  course_id: string;
  course_name: string | null;
  rounds: number;
  members: number;
  pos: number;
  is_tie: boolean;
  user_id: string;
  display_name: string | null;
  whs_score_id: string | null;
  /** CB4.5 — new GET_COMPETITION_BOARDS_2 column; null until Ben runs that SQL,
   * and null for a member with no photo (MemberAvatar falls back to initials). */
  profile_photo_url: string | null;
  net_score: number | null;
  gross_score: number | null;
  course_par: number | null;
}

export interface CompetitionCard {
  key: string;
  course_id: string;
  course_name: string | null;
  comp_date: string;
  members: number;
  rows: CompetitionBoardRow[];
}

export const COMPETITION_WINDOW = '30';

export function competitionRpcArgs(viewerId: string | undefined, scope: BoardFilters['scope']) {
  return { p_viewer: viewerId ?? null, p_scope: scope, p_window: COMPETITION_WINDOW, p_min_members: 3, p_podium: 100, p_limit: 3 };
}

/** Groups by course_id AND comp_date, in returned order — never re-sorted. */
export function groupCompetitionCards(rows: CompetitionBoardRow[]): CompetitionCard[] {
  const cards = new Map<string, CompetitionCard>();
  for (const r of rows) {
    const key = `${r.course_id}|${r.comp_date}`;
    let card = cards.get(key);
    if (!card) {
      card = { key, course_id: r.course_id, course_name: r.course_name, comp_date: r.comp_date, members: r.members, rows: [] };
      cards.set(key, card);
    }
    card.rows.push(r);
  }
  return [...cards.values()];
}

export function useCompetitionBoards(viewerId: string | undefined, scope: BoardFilters['scope'], enabled = true) {
  const args = competitionRpcArgs(viewerId, scope);
  return useQuery<CompetitionBoardRow[]>({
    queryKey: ['discover', 'competition-boards', args],
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_competition_boards' as never, args as never);
      if (error) throw error;
      return (data ?? []) as unknown as CompetitionBoardRow[];
    },
  });
}
