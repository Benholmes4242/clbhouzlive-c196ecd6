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
import { currentSeasonYear } from '../../_shared/stats/useLeaderCategories';
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

/* Season resolution: currentSeasonYear() in _shared/stats/useLeaderCategories
   is the ONE definition. This file had an identical local copy; it is gone. */

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

/**
 * H11.1 — the 90-day movement window.
 *
 * sr_world_rankings keeps real history (30 snapshots, 2026-01-29 -> 2026-09-14,
 * 228 days covered), so the delta is measured at 90 days exactly: the most
 * recent ranking_date on or before (latest - 90 days), NOT the oldest row.
 * `basisDays` reports the window actually used so the basis line can never
 * claim 90 days over a shorter span.
 *
 * tour_season_rankings carries no history at all (one scraped_at, one row per
 * player), so the Race to Dubai / LPGA / Korn Ferry boards return
 * basisDays = null and movement = null: no column, no basis line, no dashes.
 */
const MOVEMENT_WINDOW_DAYS = 90;

export interface RankingsBoardResult {
  rows: RankingsRow[];
  /** Days between the compared snapshots, or null when this board has no history. */
  basisDays: number | null;
  /** The comparison snapshot's date (World only) — feeds the "SINCE {d MMM}" header. */
  comparisonDate: string | null;
  /** The latest ranking_date (World only) — anchors the climber's 180-day history read. */
  latestDate: string | null;
  /** Comparison-snapshot ranks for EVERY player (World only), so followed
   *  players below the five get a movement figure without another read. */
  comparisonRanks: Record<string, number> | null;
  /** Remaining events in the tour's current season (season boards only), or
   *  null when they cannot be counted from sr_tournaments. */
  eventsLeft: number | null;
}

function isoMinusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(laterIso: string, earlierIso: string): number {
  const ms =
    new Date(`${laterIso}T00:00:00Z`).getTime() - new Date(`${earlierIso}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/** The comparison snapshot: newest ranking_date on or before (latest - 90 days). */
async function fetchComparisonSnapshot(
  latestDate: string,
): Promise<{ date: string; ranks: Map<string, number> } | null> {
  const cutoff = isoMinusDays(latestDate, MOVEMENT_WINDOW_DAYS);
  const { data: dateRows, error: dateErr } = await supabase
    .from('sr_world_rankings')
    .select('ranking_date')
    .lte('ranking_date', cutoff)
    .order('ranking_date', { ascending: false })
    .limit(1);
  if (dateErr) return null;
  const date = (dateRows ?? [])[0]?.ranking_date ?? null;
  if (!date) return null;
  const { data, error } = await supabase
    .from('sr_world_rankings')
    .select('player_id, rank')
    .eq('ranking_date', date);
  if (error) return null;
  const ranks = new Map<string, number>();
  ((data ?? []) as any[]).forEach((r) => {
    if (r.player_id && typeof r.rank === 'number' && r.rank >= 1) ranks.set(r.player_id, r.rank);
  });
  return { date, ranks };
}

async function fetchOwgr(): Promise<RankingsBoardResult> {
  // The read covers the top 50 (was 40): the five shown are unchanged, and the
  // biggest-climb card is picked from the same fifty.
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
    .limit(50);
  if (error) throw error;
  const latest = data?.[0]?.ranking_date ?? null;
  const rows = (data ?? [])
    .filter((r: any) => r.ranking_date === latest)
    .filter((r: any) => r.player && r.rank > 0)
    .slice(0, 50);
  const [statsMap, comparison] = await Promise.all([
    fetchOwgrStats(rows.map((r: any) => r.player.id)),
    latest ? fetchComparisonSnapshot(latest) : Promise.resolve(null),
  ]);
  const basisDays =
    comparison && latest ? daysBetween(latest, comparison.date) : null;
  return {
    basisDays,
    comparisonDate: comparison?.date ?? null,
    latestDate: latest,
    comparisonRanks: comparison ? Object.fromEntries(comparison.ranks) : null,
    eventsLeft: null,
    rows: rows.map((r: any) => {
      const s = statsMap.get(r.player.id);
      const older = comparison?.ranks.get(r.player.id) ?? null;
      return {
        rank: r.rank,
        priorRank: older,
        playerId: r.player.id,
        playerName: r.player.full_name,
        country: r.player.country ?? null,
        photoUrl: r.player.photo_url ?? null,
        points: r.points ?? null,
        // H11.4: rank delta over the 90-day window. Positive = climbed.
        // This is member-analytics polarity (green up / red down) and it NEVER
        // goes through getScoreColor, which carries the to-par polarity.
        movement: comparison ? movementFrom(r.rank, older) : null,
        wins: s?.wins ?? null,
        top10s: s?.top10s ?? null,
      };
    }),
  };
}


/** tour_season_rankings tour_code -> sr_seasons tour_name (verified: EURO/LPGA/PGAD/LIV). */
const SEASON_SR_TOUR: Record<'euro' | 'lpga' | 'liv' | 'pgad', string> = {
  euro: 'EURO',
  lpga: 'LPGA',
  liv: 'LIV',
  pgad: 'PGAD',
};

/**
 * "with {n} events left": sr_tournaments rows in the tour's current season
 * (the same year the board read uses) whose status is scheduled or created —
 * i.e. not yet played. Any read failure -> null and the clause is omitted.
 */
async function countEventsLeft(tourCode: 'euro' | 'lpga' | 'liv' | 'pgad'): Promise<number | null> {
  const year = new Date().getFullYear();
  const { data: seasons, error: sErr } = await supabase
    .from('sr_seasons')
    .select('id')
    .eq('tour_name', SEASON_SR_TOUR[tourCode])
    .eq('year', year);
  if (sErr) return null;
  const seasonIds = ((seasons ?? []) as any[]).map((s) => s.id);
  if (seasonIds.length === 0) return null;
  const { count, error: tErr } = await supabase
    .from('sr_tournaments')
    .select('id', { count: 'exact', head: true })
    .in('season_id', seasonIds)
    .in('status', ['scheduled', 'created']);
  if (tErr || count == null) return null;
  return count;
}

async function fetchSeasonBoard(
  tourCode: 'euro' | 'lpga' | 'liv' | 'pgad',
): Promise<RankingsBoardResult> {
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

  return {
    // H11.1: tour_season_rankings has no history — one scraped_at, one row per
    // player. Its position_change string has no snapshot behind it, so these
    // boards carry NO delta at all rather than a week-shaped number sitting
    // beside a 90-day one on the World board.
    basisDays: null,
    comparisonDate: null,
    latestDate: null,
    comparisonRanks: null,
    eventsLeft: await countEventsLeft(tourCode),
    rows: rows.map((r) => {
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
        // tour_season_rankings has no top-10 column — genuinely absent, so the
        // figure collapses on these boards rather than rendering "TOP 10 0".
        top10s: null,
      };
    }),
  };
}

export function useRankingsBoards(board: RankingsBoard) {
  return useQuery({
    queryKey: ['overview', 'rankings', board],
    queryFn: async (): Promise<RankingsBoardResult> => {
      if (board === 'owgr') return fetchOwgr();
      if (board === 'r2d') return fetchSeasonBoard('euro');
      if (board === 'cme') return fetchSeasonBoard('lpga');
      if (board === 'livpts') return fetchSeasonBoard('liv');
      return fetchSeasonBoard('pgad');
    },
    staleTime: 60 * 60 * 1000,
  });
}
