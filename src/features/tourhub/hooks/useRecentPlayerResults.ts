/**
 * useRecentPlayerResults — batch fetch each player's most recent notable finish
 * (positions 1–10) within the last 4 weeks.
 *
 * Single query against sr_leaderboards joined to sr_tournaments.end_date.
 * Dedupes per (player_id, tournament_id) and per player (most recent wins).
 * Excludes CUT/WD/DNS/DQ via status filter.
 *
 * Cache: 4h staleTime (data refreshes weekly), 24h gcTime. Cache key uses
 * the sorted player_id list so tab switches with the same player set hit cache.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentResult {
  position: number;
  tied: boolean;
  tournamentName: string;
  date: string; // ISO date (end_date)
}

export type RecentResultsMap = Map<string, RecentResult>;

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

function buildCacheKey(playerIds: string[]): string {
  // Sorted, joined — stable across re-renders with same player set.
  return [...playerIds].sort().join(',');
}

function fourWeeksAgoISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 28);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useRecentPlayerResults(playerIds: string[]) {
  const cacheKey = buildCacheKey(playerIds);

  return useQuery<RecentResultsMap>({
    queryKey: ['tourhub', 'recent-player-results', cacheKey],
    enabled: playerIds.length > 0,
    staleTime: FOUR_HOURS,
    gcTime: TWENTY_FOUR_HOURS,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const since = fourWeeksAgoISO();
      const until = todayISO();

      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(
          `
          player_id,
          tournament_id,
          position,
          position_tied,
          status,
          sr_tournaments!inner ( name, end_date )
        `,
        )
        .in('player_id', playerIds)
        .gte('sr_tournaments.end_date', since)
        .lte('sr_tournaments.end_date', until)
        .gte('position', 1)
        .lte('position', 10)
        .or('status.is.null,status.eq.active');

      if (error) {
        console.error('[useRecentPlayerResults] query error:', error);
        return new Map();
      }

      if (!data) return new Map();

      // Dedupe per (player_id, tournament_id) — team events (Zurich-style)
      // can produce duplicate rows; keep the first encountered.
      const seenPair = new Set<string>();
      // Per player, keep only the most recent (latest end_date) notable finish.
      const byPlayer: RecentResultsMap = new Map();

      // Sort defensively by end_date DESC so the first row per player wins.
      const rows = [...data].sort((a: any, b: any) => {
        const da = a.sr_tournaments?.end_date ?? '';
        const db = b.sr_tournaments?.end_date ?? '';
        return db.localeCompare(da);
      });

      for (const row of rows as any[]) {
        const playerId: string = row.player_id;
        const tournamentId: string = row.tournament_id;
        const pairKey = `${playerId}:${tournamentId}`;
        if (seenPair.has(pairKey)) continue;
        seenPair.add(pairKey);

        if (byPlayer.has(playerId)) continue;

        const tournament = row.sr_tournaments;
        if (!tournament) continue;

        byPlayer.set(playerId, {
          position: Number(row.position),
          tied: Boolean(row.position_tied),
          tournamentName: tournament.name ?? '',
          date: tournament.end_date ?? '',
        });
      }

      return byPlayer;
    },
  });
}

export default useRecentPlayerResults;
