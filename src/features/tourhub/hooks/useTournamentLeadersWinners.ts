/**
 * useTournamentLeadersWinners - Fetches top 3 positions for live & completed tournaments
 * 
 * Returns a map of tournament_id → { leader/winner + topFinishers[1-3] }
 * - Live tournaments: current leader + top 3
 * - Completed tournaments: winner + podium top 3
 * 
 * Includes player photo_url for avatar rendering.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentFinisher {
  playerId: string | null;
  firstName: string;
  lastName: string;
  score: number | null;
  money: number | null;
  position: number;
  photoUrl: string | null;
  /** Formatted display: "S. Scheffler" */
  displayName: string;
  /** Formatted score: "-12" or "E" or "+3" */
  displayScore: string;
}

export interface TournamentLeaderWinner extends TournamentFinisher {
  /** All top 3 finishers (positions 1–3), winner/leader first */
  topFinishers: TournamentFinisher[];
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
    queryKey: ['tourhub', 'tournament-leaders-winners-v2', tournamentIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, TournamentLeaderWinner>> => {
      if (tournamentIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          tournament_id,
          position,
          score,
          money,
          player_id,
          player:sr_players!inner (
            first_name,
            last_name,
            photo_url
          )
        `)
        .in('tournament_id', tournamentIds)
        .lte('position', 3)
        .order('tournament_id', { ascending: true })
        .order('position', { ascending: true });

      if (error) {
        console.error('[useTournamentLeadersWinners]', error.message);
        return new Map();
      }

      console.log('[LEADERS] Raw rows:', data?.map(r => ({
        tournamentId: r.tournament_id.slice(0, 8),
        position: r.position,
        name: (r.player as any)?.last_name,
        score: r.score
      })));

      // Group by tournament_id, then by position (take first occurrence per position)
      const byTournament = new Map<string, TournamentFinisher[]>();

      for (const entry of data || []) {
        const tid = entry.tournament_id;
        if (!byTournament.has(tid)) byTournament.set(tid, []);
        
        const existing = byTournament.get(tid)!;
        // Skip if we already have this position for this tournament
        if (existing.some(f => f.position === entry.position)) continue;

        const player = entry.player as any;
        const firstName = player?.first_name || null;
        const lastName = player?.last_name || null;

        existing.push({
          playerId: entry.player_id || null,
          firstName: firstName || '',
          lastName: lastName || '',
          score: entry.score,
          money: entry.money,
          position: entry.position,
          photoUrl: player?.photo_url || null,
          displayName: formatDisplayName(firstName, lastName),
          displayScore: formatScore(entry.score),
        });
      }

      const result = new Map<string, TournamentLeaderWinner>();

      for (const [tid, finishers] of byTournament) {
        const sorted = finishers.sort((a, b) => a.position - b.position);
        const leader = sorted[0];
        if (!leader) continue;

        result.set(tid, {
          ...leader,
          topFinishers: sorted,
        });
      }

      return result;
    },
    enabled: tournamentIds.length > 0,
    staleTime: 5_000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
}
