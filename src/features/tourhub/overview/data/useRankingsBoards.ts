/**
 * useRankingsBoards — Overview V4 world rankings section.
 * board: 'owgr'   -> sr_world_rankings (latest ranking_date, top 5, rank vs prior_rank)
 *        'r2d'    -> tour_season_rankings (tour_code = 'euro', current season_year, top 5)
 *        'cme'    -> tour_season_rankings (tour_code = 'lpga')
 *        'livpts' -> tour_season_rankings (tour_code = 'liv')
 *        'kft'    -> tour_season_rankings (tour_code = 'pgad')
 * These chips are independent from the hero tour picker.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { movementFrom } from '../../_shared/movement';

/**
 * Each id names the SOURCE, not a marketing name. 'cme' was called 'rolex' until
 * it was found to read the CME points list — the Rolex Women's World Rankings
 * are a separate system this code does not read.
 */
export type RankingsBoard = 'owgr' | 'r2d' | 'cme' | 'livpts' | 'kft';

export interface RankingsRow {
  rank: number;
  priorRank: number | null;
  playerId: string | null;
  playerName: string;
  country: string | null;
  photoUrl: string | null;
  points: number | null;
  movement: number | null; // positive = climbed, negative = fell
  /** Season wins. NULL = the feed has no figure (collapse it); 0 = a fact (render "WINS 0"). */
  wins: number | null;
  /** Season top-10s. Only the PGA season stats carry this; season boards leave it null. */
  top10s: number | null;
}

/** Season-year convention shared with players-v2: the season flips in October. */
function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

/**
 * Wins / top-10s are NOT on sr_world_rankings — that table carries points and
 * movement only. The players page reads them from sr_player_statistics, so the
 * OWGR board joins the same table here (newest stored season wins) rather than
 * inventing a figure.
 */
async function fetchOwgrStats(
  playerIds: string[],
): Promise<Map<string, { wins: number | null; top10s: number | null }>> {
  const out = new Map<string, { wins: number | null; top10s: number | null }>();
  if (playerIds.length === 0) return out;
  const year = currentSeasonYear();
  const { data: seasons } = await supabase
    .from('sr_seasons')
    .select('id, year')
    .eq('tour_name', 'pga')
    .in('year', [year, year - 1]);
  const seasonYear = new Map<string, number>(((seasons ?? []) as any[]).map((s) => [s.id, s.year]));
  if (seasonYear.size === 0) return out;
  const { data: stats } = await supabase
    .from('sr_player_statistics')
    .select('player_id, wins, top_10s, season_id')
    .in('player_id', playerIds)
    .in('season_id', [...seasonYear.keys()]);
  const bestYear = new Map<string, number>();
  ((stats ?? []) as any[]).forEach((s) => {
    const y = seasonYear.get(s.season_id) ?? 0;
    if ((bestYear.get(s.player_id) ?? -1) >= y) return;
    bestYear.set(s.player_id, y);
    out.set(s.player_id, { wins: s.wins ?? null, top10s: s.top_10s ?? null });
  });
  return out;
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
  const rows = (data ?? [])
    .filter((r: any) => r.ranking_date === latest)
    .filter((r: any) => r.player && r.rank > 0)
    .slice(0, 5);
  const statsMap = await fetchOwgrStats(rows.map((r: any) => r.player.id));
  return rows.map((r: any) => {
    const s = statsMap.get(r.player.id);
    return {
      rank: r.rank,
      priorRank: r.prior_rank ?? null,
      playerId: r.player.id,
      playerName: r.player.full_name,
      country: r.player.country ?? null,
      photoUrl: r.player.photo_url ?? null,
      points: r.points ?? null,
      movement: movementFrom(r.rank, r.prior_rank ?? null),
      wins: s?.wins ?? null,
      top10s: s?.top10s ?? null,
    };
  });
}


async function fetchSeasonBoard(tourCode: 'euro' | 'lpga' | 'liv' | 'pgad'): Promise<RankingsRow[]> {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from('tour_season_rankings' as any)
    .select('position, position_change, points, player_name, country, player_id, manual_player_id, wins')
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
      // position_change stores the feed's own convention: positive = climbed.
      movement: change != null && !Number.isNaN(change) ? change : null,
      wins: r.wins ?? null,
      // tour_season_rankings has no top-10 column — genuinely absent, so the
      // figure collapses on these boards rather than rendering "TOP 10 0".
      top10s: null,

    };
  });
}

export function useRankingsBoards(board: RankingsBoard) {
  return useQuery({
    queryKey: ['overview', 'rankings', board],
    queryFn: async (): Promise<RankingsRow[]> => {
      if (board === 'owgr') return fetchOwgr();
      if (board === 'r2d') return fetchSeasonBoard('euro');
      if (board === 'cme') return fetchSeasonBoard('lpga');
      if (board === 'livpts') return fetchSeasonBoard('liv');
      return fetchSeasonBoard('pgad');
    },
    staleTime: 60 * 60 * 1000,
  });
}
