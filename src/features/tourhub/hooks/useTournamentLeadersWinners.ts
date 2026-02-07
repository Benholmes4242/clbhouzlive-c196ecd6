/**
 * useTournamentLeadersWinners - Fetches position=1 entries for live & completed tournaments
 * 
 * Returns a map of tournament_id → { name, score } for:
 * - Live tournaments: current leader
 * - Completed tournaments: winner
 * 
 * Single query, minimal payload.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentLeaderWinner {
  firstName: string;
  lastName: string;
  score: number | null;
  money: number | null;
  /** Formatted display: "S. Scheffler" */
  displayName: string;
  /** Formatted score: "-12" or "E" or "+3" */
  displayScore: string;
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return '';
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

function formatDisplayName(firstName: string | null, lastName: string | null): string {
  if (!firstName && !lastName) return 'Unknown';
  if (!firstName) return lastName || 'Unknown';
  return `${firstName.charAt(0)}. ${lastName}`;
}

export function useTournamentLeadersWinners(tournamentIds: string[]) {
  return useQuery({
    queryKey: ['tourhub', 'tournament-leaders-winners', tournamentIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, TournamentLeaderWinner>> => {
      if (tournamentIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          tournament_id,
          position,
          score,
          money,
          player:sr_players!sr_leaderboards_player_id_fkey (
            first_name,
            last_name
          )
        `)
        .in('tournament_id', tournamentIds)
        .eq('position', 1);

      if (error) {
        console.error('[useTournamentLeadersWinners]', error.message);
        return new Map();
      }

      const result = new Map<string, TournamentLeaderWinner>();

      for (const entry of data || []) {
        // Skip if we already have an entry for this tournament (take first position=1)
        if (result.has(entry.tournament_id)) continue;

        const player = entry.player as any;
        const firstName = player?.first_name || null;
        const lastName = player?.last_name || null;

        result.set(entry.tournament_id, {
          firstName: firstName || '',
          lastName: lastName || '',
          score: entry.score,
          money: entry.money,
          displayName: formatDisplayName(firstName, lastName),
          displayScore: formatScore(entry.score),
        });
      }

      return result;
    },
    enabled: tournamentIds.length > 0,
    staleTime: 60_000, // 1 min for live data freshness
    refetchInterval: (query) => {
      // Refetch every 60s if there are any live tournaments
      return query.state.data && query.state.data.size > 0 ? 60_000 : false;
    },
  });
}
