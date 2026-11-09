/**
 * useFollowedBoardRows — the "Your players" read for the rebuilt World
 * rankings section.
 *
 * ONE extra read of the same board, filtered to the followed player ids —
 * never one read per player. World reads sr_world_rankings at the latest
 * ranking_date (passed in from the board result); season boards read
 * tour_season_rankings for the board's tour and season year. Guests never
 * reach this hook (the caller passes zero ids and enabled=false).
 * The shared unfiltered list-year probe prevents a missing followed player
 * from selecting the previous year while the main board uses the current one.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RankingsBoard, RankingsRow } from './useRankingsBoards';
import { seasonRankingYear } from './useRankingsBoards';

const SEASON_TOUR: Record<Exclude<RankingsBoard, 'owgr'>, 'euro' | 'lpga' | 'liv' | 'pgad'> = {
  r2d: 'euro',
  cme: 'lpga',
  livpts: 'liv',
  kft: 'pgad',
};

async function fetchFollowedOwgr(playerIds: string[], latestDate: string): Promise<RankingsRow[]> {
  const { data, error } = await supabase
    .from('sr_world_rankings')
    .select(`
      rank, points, player_id,
      player:sr_players!sr_world_rankings_player_id_fkey (
        id, full_name, country, photo_url
      )
    `)
    .eq('ranking_date', latestDate)
    .in('player_id', playerIds)
    .order('rank', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as any[])
    .filter((r) => r.player && r.rank > 0)
    .map((r) => ({
      rank: r.rank,
      priorRank: null,
      playerId: r.player.id,
      playerName: r.player.full_name,
      country: r.player.country ?? null,
      photoUrl: r.player.photo_url ?? null,
      points: r.points ?? null,
      // Filled in by the caller from the board's comparison snapshot.
      movement: null,
      wins: null,
      top10s: null,
    }));
}

export async function fetchFollowedSeason(
  tourCode: 'euro' | 'lpga' | 'liv' | 'pgad',
  playerIds: string[],
): Promise<RankingsRow[]> {
  const { year } = await seasonRankingYear(tourCode);
  const list = playerIds.map((id) => `"${id}"`).join(',');
  const { data, error } = await supabase
    .from('tour_season_rankings' as any)
    .select('position, points, player_name, country, player_id, manual_player_id, wins')
    .eq('tour_code', tourCode)
    .eq('season_year', year)
    .or(`player_id.in.(${list}),manual_player_id.in.(${list})`)
    .order('position', { ascending: true });
  if (error) throw error;
  const rows = (data as any[]) ?? [];

  // Same headshot/name resolution as the main season read: no FK from the
  // rankings table to sr_players, so resolve in a second query.
  const resolvedIds = rows.map((r) => r.player_id ?? r.manual_player_id ?? null).filter((v): v is string => !!v);
  const playerMap = new Map<string, { full_name: string; photo_url: string | null; country: string | null }>();
  if (resolvedIds.length > 0) {
    const { data: players, error: pErr } = await supabase
      .from('sr_players')
      .select('id, full_name, photo_url, country')
      .in('id', resolvedIds);
    if (!pErr) {
      (players ?? []).forEach((p: any) =>
        playerMap.set(p.id, { full_name: p.full_name, photo_url: p.photo_url ?? null, country: p.country ?? null }),
      );
    }
  }

  return rows.map((r) => {
    const pid = r.player_id ?? r.manual_player_id ?? null;
    const joined = pid ? playerMap.get(pid) : null;
    return {
      rank: r.position,
      priorRank: null,
      playerId: pid,
      playerName: joined?.full_name ?? r.player_name,
      country: joined?.country ?? r.country ?? null,
      photoUrl: joined?.photo_url ?? null,
      points: r.points ?? null,
      movement: null,
      wins: r.wins ?? null,
      top10s: null,
    };
  });
}

export function useFollowedBoardRows(
  board: RankingsBoard,
  playerIds: string[],
  latestDate: string | null,
  enabled: boolean,
) {
  const sortedIds = [...playerIds].sort();
  return useQuery({
    queryKey: ['overview', 'rankings', 'followed', board, latestDate, sortedIds],
    enabled: enabled && sortedIds.length > 0 && (board !== 'owgr' || latestDate != null),
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<RankingsRow[]> => {
      if (board === 'owgr') return fetchFollowedOwgr(sortedIds, latestDate as string);
      return fetchFollowedSeason(SEASON_TOUR[board], sortedIds);
    },
  });
}
