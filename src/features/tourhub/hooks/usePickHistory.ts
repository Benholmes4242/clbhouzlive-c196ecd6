/**
 * usePickHistory — Fetches completed tournaments with AI predictions + actual winners
 * for the Pick Record rail on the results view.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PickHistoryEntry {
  tournamentId: string;
  tournamentName: string;
  shortName: string;
  topPickName: string;
  topPickPlayerId: string;
  actualPosition: number | null;
  actualPositionTied: boolean;
  isWinner: boolean;
  scoreToPar: number | null;
  year: string;
}

/** Extract a short display name from a full tournament name */
function getShortName(name: string): string {
  const skipWords = new Set(['open', 'classic', 'invitational', 'championship', 'tournament', 'the', 'at']);
  const words = name.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (!skipWords.has(w.toLowerCase()) && w.length > 2) return w;
  }
  return words[0] ?? name;
}

export function usePickHistory() {
  return useQuery({
    queryKey: ['tourhub', 'pick-history'],
    queryFn: async (): Promise<PickHistoryEntry[]> => {
      // Step 1: fetch predictions with tournament data
      const { data: predRows, error: predError } = await supabase
        .from('ai_predictions')
        .select(`
          tournament_id,
          predictions,
          sr_tournaments!inner(
            id, name, status, start_date
          )
        `)
        .in('sr_tournaments.status', ['closed', 'complete'])
        .order('sr_tournaments(start_date)', { ascending: false })
        .limit(10);

      if (predError) {
        console.error('usePickHistory predictions error:', predError);
        return [];
      }
      if (!predRows?.length) return [];

      const tournamentIds = predRows.map(r => r.tournament_id);

      // Step 2: batch fetch event winners
      const { data: winnersData } = await supabase
        .from('event_winners')
        .select('tournament_id, player_id, score_to_par, player:sr_players(full_name, sr_id)')
        .in('tournament_id', tournamentIds);

      const winnersMap = new Map(
        (winnersData || []).map(w => [w.tournament_id, w])
      );

      // Step 3: build entries with leaderboard lookups for actual positions
      const entries: PickHistoryEntry[] = [];

      for (const row of predRows) {
        const tournament = (row as any).sr_tournaments;
        if (!tournament) continue;

        const predictions = (row.predictions as any[]) || [];
        const sortedPreds = [...predictions].sort(
          (a, b) => (a.rank ?? a.predictedRank ?? 99) - (b.rank ?? b.predictedRank ?? 99)
        );
        const topPick = sortedPreds[0];
        if (!topPick) continue;

        const playerName = topPick.playerName || topPick.player_name || topPick.name || '';
        const playerId = topPick.playerId || topPick.player_id || topPick.pgaTourId || '';
        if (!playerName) continue;

        const winner = winnersMap.get(row.tournament_id);
        const winnerName = (winner?.player as any)?.full_name ?? '';
        const isWin = !!(winnerName && winnerName.toLowerCase() === playerName.toLowerCase());

        // Fetch actual finishing position from leaderboard
        let actualPosition: number | null = isWin ? 1 : null;
        let actualPositionTied = false;

        if (!isWin && playerId) {
          const { data: lbRow } = await supabase
            .from('sr_leaderboards')
            .select('position, position_tied, sr_players!inner(sr_id)')
            .eq('tournament_id', row.tournament_id)
            .eq('sr_players.sr_id', playerId)
            .maybeSingle();

          if (lbRow) {
            actualPosition = lbRow.position;
            actualPositionTied = lbRow.position_tied || false;
          }
        }

        entries.push({
          tournamentId: row.tournament_id,
          tournamentName: tournament.name || '',
          shortName: getShortName(tournament.name || ''),
          topPickName: playerName,
          topPickPlayerId: playerId,
          actualPosition,
          actualPositionTied,
          isWinner: isWin,
          scoreToPar: isWin ? (winner?.score_to_par ?? null) : null,
          year: tournament.start_date
            ? new Date(tournament.start_date).getFullYear().toString()
            : new Date().getFullYear().toString(),
        });
      }

      return entries.filter(e => e.topPickName).slice(0, 10);
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
