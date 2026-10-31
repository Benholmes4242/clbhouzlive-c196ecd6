/** One cached whole-field read per tournament/round, never per row. Existing
 * syncScorecards already stores the whole provider field; no provider calls here.
 * Board dataUpdatedAt carries its existing refetch lifecycle into this cache. */
import { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BoardHole { player_id: string | null; round_number: number; hole_number: number; strokes: number | null; par: number | null; starting_hole: number | null }
export async function readBoardHoles(tournamentId: string, round: number): Promise<BoardHole[]> {
  const { data, error } = await supabase.from('sr_scorecards')
    .select('player_id, round_number, hole_number, strokes, par, starting_hole')
    .eq('tournament_id', tournamentId).eq('round_number', round)
    .order('hole_number', { ascending: true }).limit(4000);
  if (error) throw error;
  return data ?? [];
}
export function useBoardHoles(tournamentId: string | null, round: number | null, boardUpdatedAt = 0, enabled = true) {
  const query = useQuery({ queryKey: ['tour-board-holes', tournamentId, round], enabled: enabled && !!tournamentId && round != null,
    staleTime: 30_000, refetchOnWindowFocus: true,
    queryFn: () => tournamentId && round != null ? readBoardHoles(tournamentId, round) : Promise.resolve([]) });
  const stamp = useRef({ tournamentId, round, at: boardUpdatedAt });
  useEffect(() => {
    const previous = stamp.current;
    stamp.current = { tournamentId, round, at: boardUpdatedAt };
    if (enabled && previous.tournamentId === tournamentId && previous.round === round && previous.at > 0 && boardUpdatedAt > previous.at) void query.refetch();
  }, [tournamentId, round, boardUpdatedAt, enabled, query.refetch]);
  const byPlayer = useMemo(() => {
    const map = new Map<string, BoardHole[]>();
    if (query.isError) return map;
    for (const hole of query.data ?? []) { if (!hole.player_id) continue; const rows = map.get(hole.player_id) ?? []; rows.push(hole); map.set(hole.player_id, rows); }
    return map;
  }, [query.data, query.isError]);
  return { ...query, byPlayer };
}