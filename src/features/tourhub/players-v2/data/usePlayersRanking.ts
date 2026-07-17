/**
 * usePlayersRanking — the Players ledger source of truth.
 *
 * Per-tour reality (measured against sr_player_statistics + tour_season_rankings):
 *   pga   -> sr_player_statistics (fedex_points DESC), stat label "FEDEX PTS"      [synced]
 *   euro  -> tour_season_rankings (position ASC),      stat label "RTD PTS"        [synced]
 *   lpga  -> tour_season_rankings (position ASC),      stat label "CME PTS"        [synced]
 *   pgad  -> tour_season_rankings (position ASC),      stat label "POINTS"         [synced]
 *   liv   -> tour_season_rankings (position ASC),      stat label "LIV PTS"        [synced]
 *   champ -> sr_world_rankings order via useElitePlayers pool                     [degrade]
 *
 * Season is resolved deterministically by (tour_name, year) with a
 * generous limit and a probe: if the current year has no rows, walk
 * back one season.
 */

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import type { TourId } from '../../hooks/useOverviewData';

export interface RankedRow {
  playerId: string;
  rank: number;
  name: string;
  firstName: string;
  lastName: string;
  country: string | null;
  countryCode: string | null;
  photoUrl: string | null;
  tourCode: string | null;
  stat: number | null;
  wins: number | null;
  top10s: number | null;
  tournamentsPlayed: number | null;
}

export interface RankingResult {
  synced: boolean;
  statLabel: string | null;
  rows: RankedRow[];
}

/** Maps tour → i18n key under `players.statLabel.*`. `champ` has no stat label. */
const STAT_LABEL_KEY: Record<TourId, string | null> = {
  pga: 'players.statLabel.pga',
  euro: 'players.statLabel.euro',
  lpga: 'players.statLabel.lpga',
  pgad: 'players.statLabel.pgad',
  liv: 'players.statLabel.liv',
  champ: null,
};

const DB_TOUR_NAME: Record<TourId, string[]> = {
  pga: ['pga'],
  euro: ['EURO'],
  lpga: ['LPGA'],
  pgad: ['PGAD'],
  liv: ['LIV'],
  champ: ['CHAMP'],
};

function currentSeasonYear(): number {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}

async function resolvePgaSeasonId(): Promise<string | null> {
  const year = currentSeasonYear();
  // Deterministic probe: prefer current year with stats rows, else walk back.
  for (const y of [year, year - 1]) {
    const { data } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('tour_name', 'pga')
      .eq('year', y)
      .limit(10);
    for (const row of data ?? []) {
      const { count } = await supabase
        .from('sr_player_statistics')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', row.id);
      if ((count ?? 0) > 0) return row.id;
    }
  }
  return null;
}

export function usePlayersRanking(tour: TourId) {
  const { t, i18n } = useTranslation('tourhub');
  const statLabelFor = (id: TourId): string | null => {
    const key = STAT_LABEL_KEY[id];
    return key ? t(key) : null;
  };
  return useQuery<RankingResult>({
    queryKey: ['players-v2', 'ranking', tour, currentSeasonYear(), i18n.language],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      if (tour === 'pga') {
        const seasonId = await resolvePgaSeasonId();
        if (!seasonId) return { synced: false, statLabel: null, rows: [] };
        const { data: stats } = await supabase
          .from('sr_player_statistics')
          .select('player_id, fedex_points, fedex_rank, wins, top_10s, events_played, earnings')
          .eq('season_id', seasonId)
          .order('fedex_points', { ascending: false, nullsFirst: false })
          .limit(300);
        if (!stats?.length) return { synced: false, statLabel: null, rows: [] };
        const playerIds = [...new Set(stats.map((s) => s.player_id))];
        const { data: players } = await supabase
          .from('sr_players')
          .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
          .in('id', playerIds);
        const pmap = new Map((players ?? []).map((p) => [p.id, p]));
        let rows: RankedRow[] = stats.map((s, i) => {
          const p = pmap.get(s.player_id);
          return {
            playerId: s.player_id,
            rank: s.fedex_rank ?? i + 1,
            name: p?.full_name ?? 'Unknown',
            firstName: p?.first_name ?? '',
            lastName: p?.last_name ?? '',
            country: p?.country ?? null,
            countryCode: p?.country_code ?? null,
            photoUrl: p?.photo_url ?? null,
            tourCode: p?.tour_codes?.[0] ?? 'pga',
            stat: s.fedex_points != null ? Number(s.fedex_points) : null,
            wins: s.wins ?? null,
            top10s: s.top_10s ?? null,
            tournamentsPlayed: s.events_played ?? null,
          };
        });
        rows = [...rows].sort((a, b) => a.rank - b.rank);
        return { synced: true, statLabel: STAT_LABEL.pga, rows };
      }

      if (tour === 'euro' || tour === 'lpga' || tour === 'pgad' || tour === 'liv') {
        const year = currentSeasonYear();
        let { data: rankings } = await supabase
          .from('tour_season_rankings' as any)
          .select('player_id, manual_player_id, player_name, position, points, wins, tournaments_played, country, tour_code')
          .eq('tour_code', tour)
          .eq('season_year', year)
          .order('position', { ascending: true })
          .limit(400);
        if (!rankings?.length) {
          const alt = await supabase
            .from('tour_season_rankings' as any)
            .select('player_id, manual_player_id, player_name, position, points, wins, tournaments_played, country, tour_code')
            .eq('tour_code', tour)
            .eq('season_year', year - 1)
            .order('position', { ascending: true })
            .limit(400);
          rankings = alt.data ?? [];
        }
        if (!rankings?.length) return { synced: false, statLabel: null, rows: [] };
        const playerIds = [
          ...new Set(
            rankings
              .map((r: any) => (r.player_id ?? r.manual_player_id) as string | null)
              .filter((v: string | null): v is string => !!v),
          ),
        ];
        const { data: players } = playerIds.length
          ? await supabase
              .from('sr_players')
              .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
              .in('id', playerIds)
          : { data: [] as any[] };
        const pmap = new Map((players ?? []).map((p: any) => [p.id, p]));
        const rows: RankedRow[] = rankings.map((r: any) => {
          const pid = (r.player_id ?? r.manual_player_id ?? '') as string;
          const p = pid ? pmap.get(pid) : undefined;
          const parts = (r.player_name ?? '').split(/\s+/);
          return {
            playerId: pid,
            rank: r.position ?? 0,
            name: p?.full_name ?? r.player_name ?? 'Unknown',
            firstName: p?.first_name ?? parts[0] ?? '',
            lastName: p?.last_name ?? parts.slice(1).join(' ') ?? '',
            country: p?.country ?? r.country ?? null,
            countryCode: p?.country_code ?? null,
            photoUrl: p?.photo_url ?? null,
            tourCode: p?.tour_codes?.[0] ?? tour,
            stat: r.points != null ? Number(r.points) : null,
            wins: r.wins ?? null,
            top10s: null,
            tournamentsPlayed: r.tournaments_played ?? null,
          };
        });
        return { synced: true, statLabel: STAT_LABEL[tour], rows };
      }

      // champ (degrade) — world-ranking order from sr_world_rankings.
      const { data: rankings } = await supabase
        .from('sr_world_rankings')
        .select('player_id, rank, ranking_date')
        .order('ranking_date', { ascending: false })
        .order('rank', { ascending: true })
        .limit(500);
      if (!rankings?.length) return { synced: false, statLabel: null, rows: [] };
      const latestDate = rankings[0].ranking_date;
      const latest = rankings.filter((r) => r.ranking_date === latestDate);
      const seen = new Set<string>();
      const dedup = latest.filter((r) => (seen.has(r.player_id) ? false : (seen.add(r.player_id), true)));
      const { data: players } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
        .in('id', dedup.map((r) => r.player_id));
      const pmap = new Map((players ?? []).map((p) => [p.id, p]));
      const rows: RankedRow[] = [...dedup
        .map((r) => {
          const p = pmap.get(r.player_id);
          if (!p?.tour_codes?.includes('CHAMP')) return null;
          return {
            playerId: r.player_id,
            rank: r.rank,
            name: p.full_name,
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
            country: p.country ?? null,
            countryCode: p.country_code ?? null,
            photoUrl: p.photo_url ?? null,
            tourCode: 'champ',
            stat: null,
            wins: null,
            top10s: null,
            tournamentsPlayed: null,
          } as RankedRow;
        })
        .filter((r): r is RankedRow => !!r)]
        .sort((a, b) => a.rank - b.rank);
      return { synced: false, statLabel: null, rows };
    },
  });
}

// Silence unused-import warnings for DB_TOUR_NAME (kept as documentation).
void DB_TOUR_NAME;
