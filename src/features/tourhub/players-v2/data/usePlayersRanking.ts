/**
 * usePlayersRanking - the Players ledger source of truth.
 *
 * Per-tour reality (measured against sr_player_statistics + tour_season_rankings):
 *   pga   -> sr_player_statistics (fedex_points DESC), stat label "FEDEX PTS"      [synced]
 *   euro  -> tour_season_rankings (position ASC),      stat label "RTD PTS"        [synced]
 *   lpga  -> tour_season_rankings (position ASC),      stat label "CME PTS"        [synced]
 *   pgad  -> tour_season_rankings (position ASC),      stat label "POINTS"         [synced]
 *   liv   -> tour_season_rankings (position ASC),      stat label "LIV PTS"        [synced]
 *
 * The Champions tour is NOT on this page (PlayersTab excludes it from the lens
 * and rejects ?tour=champ), so the hook's parameter type excludes it. Whether
 * Champions belongs here is a product question, not a wiring bug.
 *
 * DB tour_code values, for reference: pga -> 'pga', euro -> 'EURO',
 * lpga -> 'LPGA', pgad -> 'PGAD', liv -> 'LIV'.
 *
 * Season is resolved deterministically by (tour_name, year) with a
 * generous limit and a probe: if the current year has no rows, walk
 * back one season.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { TourId } from '../../hooks/useOverviewData';

/** Tours this page can render. Champions is excluded by design. */
export type PlayersTourId = Exclude<TourId, 'champ'>;

export interface RankedRow {
  playerId: string;
  rank: number;
  name: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
  stat: number | null;
  wins: number | null;
  top10s: number | null;
}


export interface RankingResult {
  synced: boolean;
  statLabel: string | null;
  rows: RankedRow[];
}

/** Maps tour -> i18n key under `players.statLabel.*`. */
const STAT_LABEL_KEY: Record<PlayersTourId, string> = {
  pga: 'players.statLabel.pga',
  euro: 'players.statLabel.euro',
  lpga: 'players.statLabel.lpga',
  pgad: 'players.statLabel.pgad',
  liv: 'players.statLabel.liv',
};

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

async function resolvePgaSeasonId(): Promise<string | null> {
  const year = currentSeasonYear();
  // Deterministic probe: prefer current year with stats rows, else walk back.
  for (const y of [year, year - 1]) {
    const { data, error } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('tour_name', 'pga')
      .eq('year', y)
      .limit(10);
    if (error) throw error;
    for (const row of data ?? []) {
      const { count, error: cntErr } = await supabase
        .from('sr_player_statistics')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', row.id);
      if (cntErr) throw cntErr;
      if ((count ?? 0) > 0) return row.id;
    }
  }
  return null;
}

// Minimal structural shapes for row casts.

interface PgaStatRow {
  player_id: string;
  fedex_points: number | string | null;
  fedex_rank: number | null;
  wins: number | null;
  top_10s: number | null;
  events_played: number | null;
}

interface PlayerRow {
  id: string;
  full_name: string | null;
  country: string | null;
  country_code: string | null;
  photo_url: string | null;
  tour_codes: string[] | null;
}
interface TourSeasonRankingRow {
  player_id: string | null;
  manual_player_id: string | null;
  player_name: string | null;
  position: number | null;
  points: number | string | null;
  wins: number | null;
  country: string | null;
  tour_code: string | null;
}

const PLAYER_SELECT = 'id, full_name, country, country_code, photo_url, tour_codes';
const SEASON_RANKING_SELECT =
  'player_id, manual_player_id, player_name, position, points, wins, country, tour_code';

export function usePlayersRanking(tour: PlayersTourId) {
  const { t, i18n } = useTranslation('tourhub');
  const statLabelFor = (id: PlayersTourId): string => t(STAT_LABEL_KEY[id]);
  return useQuery<RankingResult>({
    queryKey: ['players-v2', 'ranking', tour, currentSeasonYear(), i18n.language],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      if (tour === 'pga') {
        const seasonId = await resolvePgaSeasonId();
        if (!seasonId) return { synced: false, statLabel: null, rows: [] };
        const { data: stats, error: statsErr } = await supabase
          .from('sr_player_statistics')
          .select(
            // fedex_rank is NOT selected. Measured across both stored seasons it
            // is a per-event finishing position (2025: Fleetwood 1, Henley 2,
            // Scheffler 4 = the Tour Championship result, not the season
            // standing), it ties (T5, T7, T11) and it repeats within a season.
            // Rendering it as the # of a points-ordered list guaranteed
            // disagreement. The # is now the sort position.
            'player_id, fedex_points, wins, top_10s, events_played',
          )

          .eq('season_id', seasonId)
          .order('fedex_points', { ascending: false, nullsFirst: false })
          .limit(300);
        if (statsErr) throw statsErr;
        if (!stats?.length) return { synced: false, statLabel: null, rows: [] };
        const statsRows = stats as unknown as PgaStatRow[];
        const playerIds = [...new Set(statsRows.map((s) => s.player_id))];
        const { data: players, error: playersErr } = await supabase
          .from('sr_players')
          .select(PLAYER_SELECT)
          .in('id', playerIds);
        if (playersErr) throw playersErr;
        const pmap = new Map(((players ?? []) as unknown as PlayerRow[]).map((p) => [p.id, p]));
        let rows: RankedRow[] = statsRows.map((s, i) => {
          const p = pmap.get(s.player_id);
          return {
            playerId: s.player_id,
            rank: s.fedex_rank ?? i + 1,
            name: p?.full_name ?? 'Unknown',
            country: p?.country ?? null,
            countryCode: p?.country_code ?? null,
            photoUrl: p?.photo_url ?? null,
            tourCode: p?.tour_codes?.[0] ?? 'pga',
            stat: s.fedex_points != null ? Number(s.fedex_points) : null,
            wins: s.wins ?? null,
            top10s: s.top_10s ?? null,
          };
        });

        rows = [...rows].sort((a, b) => a.rank - b.rank);
        return { synced: true, statLabel: statLabelFor('pga'), rows };
      }

      const year = currentSeasonYear();
      const primary = await supabase
        .from('tour_season_rankings' as never)
        .select(SEASON_RANKING_SELECT)
        .eq('tour_code', tour)
        .eq('season_year', year)
        .order('position', { ascending: true })
        .limit(400);
      if (primary.error) throw primary.error;
      let rankings = (primary.data ?? []) as unknown as TourSeasonRankingRow[];
      if (!rankings.length) {
        const alt = await supabase
          .from('tour_season_rankings' as never)
          .select(SEASON_RANKING_SELECT)
          .eq('tour_code', tour)
          .eq('season_year', year - 1)
          .order('position', { ascending: true })
          .limit(400);
        if (alt.error) throw alt.error;
        rankings = (alt.data ?? []) as unknown as TourSeasonRankingRow[];
      }
      if (!rankings.length) return { synced: false, statLabel: null, rows: [] };
      const playerIds = [
        ...new Set(
          rankings
            .map((r) => (r.player_id ?? r.manual_player_id) as string | null)
            .filter((v): v is string => !!v),
        ),
      ];
      let players: PlayerRow[] = [];
      if (playerIds.length) {
        const { data: pdata, error: playersErr } = await supabase
          .from('sr_players')
          .select(PLAYER_SELECT)
          .in('id', playerIds);
        if (playersErr) throw playersErr;
        players = (pdata ?? []) as unknown as PlayerRow[];
      }
      const pmap = new Map(players.map((p) => [p.id, p]));
      const rows: RankedRow[] = rankings.map((r) => {
        const pid = (r.player_id ?? r.manual_player_id ?? '') as string;
        const p = pid ? pmap.get(pid) : undefined;
        return {
          playerId: pid,
          rank: r.position ?? 0,
          name: p?.full_name ?? r.player_name ?? 'Unknown',
          country: p?.country ?? r.country ?? null,
          countryCode: p?.country_code ?? null,
          photoUrl: p?.photo_url ?? null,
          tourCode: p?.tour_codes?.[0] ?? tour,
          stat: r.points != null ? Number(r.points) : null,
          wins: r.wins ?? null,
          top10s: null,
        };

      });
      return { synced: true, statLabel: statLabelFor(tour), rows };
    },
  });
}
