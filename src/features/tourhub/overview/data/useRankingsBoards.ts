/**
 * useRankingsBoards — Overview V4 world rankings section.
 * board: 'owgr' -> sr_world_rankings (latest ranking_date, top 5, rank vs prior_rank)
 *        'r2d'  -> tour_season_rankings (tour_code = 'euro', current season_year, top 5)
 *        'rolex'-> tour_season_rankings (tour_code = 'lpga', current season_year, top 5)
 * These chips are independent from the hero tour picker.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type RankingsBoard = 'owgr' | 'r2d' | 'rolex';

export interface RankingsRow {
  rank: number;
  priorRank: number | null;
  playerId: string | null;
  playerName: string;
  country: string | null;
  photoUrl: string | null;
  points: number | null;
  movement: number | null; // positive = climbed, negative = fell
}

function movementFrom(rank: number, prior: number | null): number | null {
  if (prior == null) return null;
  return prior - rank;
}

async function fetchOwgr(): Promise<RankingsRow[]> {
  const { data, error } = await supabase
    .from('sr_world_rankings')
    .select(`
      rank, prior_rank, points, player_id, ranking_date,
      player:sr_players!sr_world_rankings_player_id_fkey (
        id, full_name, country, photo_url
      )
    `)
    .order('ranking_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(40);
  if (error) throw error;
  const latest = data?.[0]?.ranking_date ?? null;
  const rows = (data ?? []).filter((r: any) => r.ranking_date === latest);
  return rows
    .filter((r: any) => r.player && r.rank > 0)
    .slice(0, 5)
    .map((r: any) => ({
      rank: r.rank,
      priorRank: r.prior_rank ?? null,
      playerId: r.player.id,
      playerName: r.player.full_name,
      country: r.player.country ?? null,
      photoUrl: r.player.photo_url ?? null,
      points: r.points ?? null,
      movement: movementFrom(r.rank, r.prior_rank ?? null),
    }));
}

async function fetchSeasonBoard(tourCode: 'euro' | 'lpga'): Promise<RankingsRow[]> {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from('tour_season_rankings' as any)
    .select('position, position_change, points, player_name, country, player_id, manual_player_id')
    .eq('tour_code', tourCode)
    .eq('season_year', year)
    .order('position', { ascending: true })
    .limit(5);
  if (error) throw error;
  const rows = (data as any[]) ?? [];

  // No FK from tour_season_rankings.player_id -> sr_players.id, so we
  // resolve headshots + canonical names in a second query. sr_players'
  // full_name follows the "Firstname Lastname" convention the R2
  // headshot chain expects; player_name in the rankings table is often
  // uppercased ("MCILROY, Rory") which never matches the file naming.
  const playerIds = rows
    .map((r) => r.player_id ?? r.manual_player_id ?? null)
    .filter((v): v is string => !!v);
  const playerMap = new Map<string, { full_name: string; photo_url: string | null; country: string | null }>();
  if (playerIds.length > 0) {
    const { data: players, error: pErr } = await supabase
      .from('sr_players')
      .select('id, full_name, photo_url, country')
      .in('id', playerIds);
    if (!pErr) {
      (players ?? []).forEach((p: any) =>
        playerMap.set(p.id, {
          full_name: p.full_name,
          photo_url: p.photo_url ?? null,
          country: p.country ?? null,
        }),
      );
    }
  }

  return rows.map((r) => {
    const change = r.position_change ? parseInt(String(r.position_change), 10) : null;
    const pid = r.player_id ?? r.manual_player_id ?? null;
    const joined = pid ? playerMap.get(pid) : null;
    return {
      rank: r.position,
      priorRank: change != null && !Number.isNaN(change) ? r.position + change : null,
      playerId: pid,
      playerName: joined?.full_name ?? r.player_name,
      country: joined?.country ?? r.country ?? null,
      photoUrl: joined?.photo_url ?? null,
      points: r.points ?? null,
      movement: change != null && !Number.isNaN(change) ? -change : null,
    };
  });
}

export function useRankingsBoards(board: RankingsBoard) {
  return useQuery({
    queryKey: ['overview', 'rankings', board],
    queryFn: async (): Promise<RankingsRow[]> => {
      if (board === 'owgr') return fetchOwgr();
      if (board === 'r2d') return fetchSeasonBoard('euro');
      return fetchSeasonBoard('lpga');
    },
    staleTime: 60 * 60 * 1000,
  });
}
