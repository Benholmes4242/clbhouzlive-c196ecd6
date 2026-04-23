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
          team_id,
          round_1,
          round_2,
          round_3,
          round_4,
          thru,
          player:sr_players!sr_leaderboards_player_id_fkey (
            first_name, last_name, full_name, headshot_override, photo_url, country, pga_tour_id, tour_codes
          ),
          team:sr_teams!sr_leaderboards_team_id_fkey (
            id, display_name, abbr_name, country,
            members:sr_team_players(
              position_in_team,
              player:sr_players!sr_team_players_player_id_fkey(full_name, photo_url, country)
            )
          )
        `)
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

      for (const entry of (data || []) as any[]) {
        const tid = entry.tournament_id;
        if (!byTournament.has(tid)) byTournament.set(tid, []);

        const existing = byTournament.get(tid)!;
        if (existing.length >= 10) continue;

        let player = entry.player;
        let isTeam = false;
        if (!player && entry.team) {
          isTeam = true;
          const members = (entry.team.members || [])
            .filter((m: any) => m.player)
            .sort((a: any, b: any) => a.position_in_team - b.position_in_team);
          const teamName = entry.team.abbr_name || entry.team.display_name || 'Team';
          player = {
            first_name: '',
            last_name: '',
            full_name: teamName,
            headshot_override: null,
            photo_url: members[0]?.player?.photo_url ?? null,
            country: entry.team.country,
            pga_tour_id: null,
            tour_codes: null,
          };
        }
        if (!player) continue;

        const firstName = player.first_name || null;
        const lastName = player.last_name || null;
        const fullName = player.full_name || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';

        existing.push({
          playerId: entry.player_id || entry.team_id || null,
          firstName: firstName || '',
          lastName: lastName || '',
          fullName,
          headshotOverride: player.headshot_override || null,
          score: entry.score,
          money: entry.money,
          position: entry.position,
          photoUrl: player.photo_url || null,
          country: player.country || null,
          pgaTourId: player.pga_tour_id || null,
          tourCode: player.tour_codes?.[0] ?? null,
          displayName: isTeam ? fullName : formatDisplayName(firstName, lastName),
          displayScore: formatScore(entry.score),
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
