/**
 * usePickHistory — Fetches completed tournaments with AI predictions + actual winners
 * for the Pick Record rail on the results view.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEventWinners } from './useEventWinner';

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
  // Try to find a distinctive word
  for (const w of words) {
    if (!skipWords.has(w.toLowerCase()) && w.length > 2) return w;
  }
  return words[0] ?? name;
}

export function usePickHistory() {
  // Step 1: fetch predictions with tournament data
  const predQuery = useQuery({
    queryKey: ['tourhub', 'pick-history-predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
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

      if (error) {
        console.error('usePickHistory predictions error:', error);
        return [];
      }
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const tournamentIds = (predQuery.data ?? []).map(r => r.tournament_id);

  // Step 2: batch fetch event winners
  const winnersQuery = useEventWinners(tournamentIds);

  // Step 3: combine
  const combined = useQuery({
    queryKey: ['tourhub', 'pick-history', tournamentIds.sort().join(','), winnersQuery.data ? 'ready' : 'waiting'],
    queryFn: (): PickHistoryEntry[] => {
      const preds = predQuery.data ?? [];
      const winnersMap = winnersQuery.data ?? new Map();

      const entries: PickHistoryEntry[] = [];
      for (const row of preds) {
        const winner = winnersMap.get(row.tournament_id);
        if (!winner?.player) continue;

        const predictions = row.predictions as any[];
        const topPick = predictions?.[0];
        if (!topPick) continue;

        const tournament = row.sr_tournaments as any;
        const startDate = tournament?.start_date ?? '';
        const year = startDate ? new Date(startDate).getFullYear().toString() : '';

        // Check if top pick won
        const isWinner = topPick.playerId === winner.player_id;

        entries.push({
          tournamentId: row.tournament_id,
          tournamentName: tournament?.name ?? '',
          shortName: getShortName(tournament?.name ?? ''),
          topPickName: topPick.playerName ?? topPick.name ?? '',
          topPickPlayerId: topPick.playerId ?? '',
          actualPosition: isWinner ? 1 : null, // We only know winner position from event_winners
          actualPositionTied: false,
          isWinner,
          scoreToPar: winner.score_to_par,
          year,
        });
      }

      return entries;
    },
    enabled: !!predQuery.data && predQuery.data.length > 0 && !!winnersQuery.data,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    data: combined.data ?? [],
    isLoading: predQuery.isLoading || winnersQuery.isLoading || combined.isLoading,
  };
}
