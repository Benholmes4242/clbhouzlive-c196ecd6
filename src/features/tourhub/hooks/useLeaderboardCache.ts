/**
 * useLeaderboardCache — Single shared cache for sr_leaderboards data.
 *
 * Mirrors useTournamentsCache architecture.  Reads live + completed
 * tournament IDs from useTournamentsCache, then fires exactly TWO queries:
 *   1. Live tournaments → full top-10 field (for hero mini-LB + expanded LB)
 *   2. Completed tournaments → top-10 podium (for winner/podium display)
 *
 * All Overview-page consumers read from this cache instead of making
 * independent sr_leaderboards queries.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveLeaderboardEntry {
  tournament_id: string;
  position: number;
  score: number | null;
  strokes: number | null;
  thru: number | null;
  status: string | null;
  updated_at: string | null;
  thru_updated_at: string | null;
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  round_4: number | null;
  player: {
    id: string;
    sr_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    headshot_override: string | null;
    country: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    tour_codes: string[] | null;
  };
}

export interface CompletedLeaderboardEntry {
  tournament_id: string;
  position: number;
  score: number | null;
  money: number | null;
  player_id: string | null;
  round_1: number | null;
  round_2: number | null;
  round_3: number | null;
  round_4: number | null;
  thru: number | null;
  player: {
    first_name: string;
    last_name: string;
    full_name: string;
    headshot_override: string | null;
    photo_url: string | null;
    pga_tour_id: string | null;
    tour_codes: string[] | null;
  };
}

export interface LeaderboardCache {
  /** Map of tournament_id → rows (top 10, live tournaments) */
  live: Map<string, LiveLeaderboardEntry[]>;
  /** Map of tournament_id → rows (top 10, completed tournaments) */
  completed: Map<string, CompletedLeaderboardEntry[]>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLeaderboardCache() {
  const { data: tourCache } = useTournamentsCache();

  const liveTournamentIds = useMemo(
    () => (tourCache?.live ?? []).map(t => t.id),
    [tourCache?.live],
  );

  const completedTournamentIds = useMemo(
    () => (tourCache?.completed ?? []).map(t => t.id),
    [tourCache?.completed],
  );

  return useQuery({
    queryKey: ['leaderboard-cache', liveTournamentIds.join(','), completedTournamentIds.join(',')],
    queryFn: async (): Promise<LeaderboardCache> => {
      const [liveRes, completedRes] = await Promise.all([
        // LIVE: full top-10 field for all live tournaments
        liveTournamentIds.length > 0
          ? supabase
              .from('sr_leaderboards')
              .select(`
                tournament_id, position, score, strokes, thru, status,
                updated_at, thru_updated_at,
                round_1, round_2, round_3, round_4,
                player:sr_players!inner(
                  id, sr_id, first_name, last_name, full_name,
                  headshot_override, country, photo_url,
                  pga_tour_id, tour_codes
                )
              `)
              .in('tournament_id', liveTournamentIds)
              .gt('strokes', 0)
              .not('position', 'is', null)
              .order('tournament_id', { ascending: true })
              .order('position', { ascending: true })
              .limit(10 * liveTournamentIds.length)
          : Promise.resolve({ data: [] }),

        // COMPLETED: top-10 for podium/winner display
        completedTournamentIds.length > 0
          ? supabase
              .from('sr_leaderboards')
              .select(`
                tournament_id, position, score, money, player_id,
                round_1, round_2, round_3, round_4, thru,
                player:sr_players!inner(
                  first_name, last_name, full_name, headshot_override,
                  photo_url, pga_tour_id, tour_codes
                )
              `)
              .in('tournament_id', completedTournamentIds)
              .lte('position', 10)
              .order('tournament_id', { ascending: true })
              .order('position', { ascending: true })
          : Promise.resolve({ data: [] }),
      ]);

      // Group live rows by tournament_id
      const live = new Map<string, LiveLeaderboardEntry[]>();
      for (const row of (liveRes.data ?? []) as any[]) {
        const tid = row.tournament_id;
        if (!live.has(tid)) live.set(tid, []);
        live.get(tid)!.push(row);
      }

      // Group completed rows by tournament_id
      const completed = new Map<string, CompletedLeaderboardEntry[]>();
      for (const row of (completedRes.data ?? []) as any[]) {
        const tid = row.tournament_id;
        if (!completed.has(tid)) completed.set(tid, []);
        completed.get(tid)!.push(row);
      }

      return { live, completed };
    },
    enabled: liveTournamentIds.length > 0 || completedTournamentIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
