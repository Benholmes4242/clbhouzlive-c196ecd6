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
  /** Full name for R2 headshot lookup — e.g. "Jacob Bridgeman" */
  fullName: string;
  /** Override filename for R2 lookup when full_name doesn't match */
  headshotOverride: string | null;
  score: number | null;
  money: number | null;
  position: number;
  photoUrl: string | null;
  country: string | null;
  pgaTourId: string | null;
  /** Primary tour code for R2 headshot folder lookup */
  tourCode: string | null;
  /** Formatted display: "S. Scheffler" */
  displayName: string;
  /** Formatted score: "-12" or "E" or "+3" */
  displayScore: string;
  // B44 FIX 4A: round scores + thru
  round1: number | null;
  round2: number | null;
  round3: number | null;
  round4: number | null;
  thru: number | null;
}

export interface TournamentLeaderWinner extends TournamentFinisher {
  /** Top 3 finishers displayed on the card (first 3 people, regardless of position) */
  topFinishers: TournamentFinisher[];
  /** All fetched rows for this tournament (for tie overflow counting) */
  allFetched: TournamentFinisher[];
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
          round_1,
          round_2,
          round_3,
          round_4,
          thru,
          player:sr_players!inner (
            first_name,
            last_name,
            full_name,
            headshot_override,
            photo_url,
            country,
            pga_tour_id,
            tour_codes
          )
        `)
        // NOTE: photo_url is NOT used for display. All player headshots are served from R2
        // via getPlayerHeadshotUrl(). This field is kept for reference only.
        .in('tournament_id', tournamentIds)
        .lte('position', 10)
        .order('tournament_id', { ascending: true })
        .order('position', { ascending: true });

      if (error) {
        console.error('[useTournamentLeadersWinners]', error.message);
        return new Map();
      }

      // Group by tournament_id, take the first 3 people (not first 3 positions)
      const byTournament = new Map<string, TournamentFinisher[]>();

      for (const entry of data || []) {
        const tid = entry.tournament_id;
        if (!byTournament.has(tid)) byTournament.set(tid, []);
        
        const existing = byTournament.get(tid)!;
        // Stop after collecting 10 rows per tournament (for tie overflow counting)
        if (existing.length >= 10) continue;

        const player = entry.player as any;
        const firstName = player?.first_name || null;
        const lastName = player?.last_name || null;

        existing.push({
          playerId: entry.player_id || null,
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: player?.full_name || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown',
          headshotOverride: player?.headshot_override || null,
          score: entry.score,
          money: entry.money,
          position: entry.position,
          photoUrl: player?.photo_url || null,
          country: player?.country || null,
          pgaTourId: player?.pga_tour_id || null,
          tourCode: player?.tour_codes?.[0] ?? null,
          displayName: formatDisplayName(firstName, lastName),
          displayScore: formatScore(entry.score),
          // B44 FIX 4B: populate round scores
          round1: entry.round_1 ?? null,
          round2: entry.round_2 ?? null,
          round3: entry.round_3 ?? null,
          round4: entry.round_4 ?? null,
          thru: entry.thru ?? null,
        });
      }

      const result = new Map<string, TournamentLeaderWinner>();

      for (const [tid, finishers] of byTournament) {
        const sorted = finishers.sort((a, b) => a.position - b.position);
        const leader = sorted[0];
        if (!leader) continue;

        result.set(tid, {
          ...leader,
          topFinishers: sorted.slice(0, 3),  // first 3 people shown on card
          allFetched: sorted,                 // all rows for tie overflow counting
        });
      }

      return result;
    },
    enabled: tournamentIds.length > 0,
    staleTime: 30_000,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });
}
