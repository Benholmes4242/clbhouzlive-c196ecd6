/**
 * useStatWatch — season-leader rail data for Overview V4 Stat Watch.
 *
 * Coverage: sr_player_statistics is only populated for the PGA Tour
 * today (verified against the 2025/2026 seasons). Other tours return
 * an empty categories array and the section self-hides.
 *
 * Season resolution: sr_seasons row where mapTourSlug(tour_full_name)
 * matches the requested tour, latest year. Names/avatars come from
 * sr_players (no FK -> resolved in a second query).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTourSlug } from '../../_shared/tourOrder';
import type { TourId } from '../../hooks/useOverviewData';

export type StatKey = 'sg_putting' | 'sg_tee_to_green' | 'driving_distance' | 'scoring_average';

export interface StatLeader {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  headshotOverride: string | null;
  value: number;
}

export interface StatCategory {
  key: StatKey;
  label: string; // overline (uppercase-ready)
  unit: string; // micro-label
  order: 'asc' | 'desc';
  format: (v: number) => string;
  leaders: StatLeader[]; // 1..3 (self-hidden when 0)
}

const CATEGORIES: Array<{
  key: StatKey;
  column: keyof StatRow;
  label: string;
  unit: string;
  order: 'asc' | 'desc';
  format: (v: number) => string;
}> = [
  {
    key: 'sg_putting',
    column: 'strokes_gained_putting',
    label: 'SG: PUTTING',
    unit: 'per round',
    order: 'desc',
    format: (v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
  },
  {
    key: 'sg_tee_to_green',
    column: 'strokes_gained_tee_green',
    label: 'SG: TEE TO GREEN',
    unit: 'per round',
    order: 'desc',
    format: (v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
  },
  {
    key: 'driving_distance',
    column: 'driving_distance',
    label: 'DRIVING DISTANCE',
    unit: 'yards avg',
    order: 'desc',
    format: (v) => v.toFixed(1),
  },
  {
    key: 'scoring_average',
    column: 'scoring_average',
    label: 'SCORING AVERAGE',
    unit: 'per round',
    order: 'asc',
    format: (v) => v.toFixed(2),
  },
];

interface StatRow {
  player_id: string;
  strokes_gained_putting: number | null;
  strokes_gained_tee_green: number | null;
  driving_distance: number | null;
  scoring_average: number | null;
}

async function resolveSeasonIds(tour: TourId): Promise<string[]> {
  const { data, error } = await supabase
    .from('sr_seasons')
    .select('id, tour_full_name, year, created_at')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[stat-watch] sr_seasons fetch failed:', error);
    throw error;
  }
  const rows = (data ?? []) as any[];
  const matches = rows.filter((r: any) => mapTourSlug(r.tour_full_name) === tour);
  // For pga, prefer exact-name matches over fallback-mapped rows (year order
  // preserved within each group) — mapTourSlug's default returns 'pga' for
  // any unrecognized tour_full_name, which lets DP World / LIV / etc. rows
  // masquerade as pga and take the top slot.
  const sorted = tour === 'pga'
    ? [...matches].sort((a: any, b: any) => {
        const aExact = /pga/.test((a.tour_full_name ?? '').toLowerCase()) ? 0 : 1;
        const bExact = /pga/.test((b.tour_full_name ?? '').toLowerCase()) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        return (b.year ?? 0) - (a.year ?? 0);
      })
    : matches;
  const ids = sorted.slice(0, 6).map((r: any) => r.id);
  if (matches.length === 0) {
    const distinctTours = Array.from(
      new Set(rows.map((r) => r.tour_full_name ?? '(null)')),
    );
    // eslint-disable-next-line no-console
    console.warn('[stat-watch] empty season candidates for tour:', tour,
      '| fetched rows:', rows.length,
      '| distinct tour_full_name seen:', distinctTours);
  }
  if (tour === 'pga') {
    // eslint-disable-next-line no-console
    console.log('[stat-watch] pga season candidates (probe order):',
      sorted.slice(0, 6).map((r: any) => ({ id: r.id, tour: r.tour_full_name, year: r.year })));
  }
  return ids;
}


export function useStatWatch(tour: TourId) {
  return useQuery({
    queryKey: ['overview', 'stat-watch', tour],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<{ categories: StatCategory[] }> => {
      const candidates = await resolveSeasonIds(tour);
      if (candidates.length === 0) return { categories: [] };

      // Probe candidates in order — first with any sr_player_statistics row wins.
      let seasonId: string | null = null;
      for (const id of candidates) {
        const { data: probe, error: probeErr } = await supabase
          .from('sr_player_statistics')
          .select('player_id')
          .eq('season_id', id)
          .limit(1);
        if (probeErr) {
          // eslint-disable-next-line no-console
          console.error('[stat-watch] probe failed for season', id, probeErr);
          throw probeErr;
        }
        if ((probe ?? []).length > 0) {
          seasonId = id;
          break;
        }
      }
      if (!seasonId) return { categories: [] };
      if (tour === 'pga') {
        // eslint-disable-next-line no-console
        console.log('[stat-watch] pga winning season id:', seasonId);
      }

      const { data: stats, error: sErr } = await supabase
        .from('sr_player_statistics')
        .select(
          'player_id, strokes_gained_putting, strokes_gained_tee_green, driving_distance, scoring_average',
        )
        .eq('season_id', seasonId);
      if (sErr) {
        // eslint-disable-next-line no-console
        console.error('[stat-watch] sr_player_statistics fetch failed:', sErr);
        throw sErr;
      }
      const rows = (stats ?? []) as StatRow[];
      if (rows.length === 0) return { categories: [] };


      // Rank per category, keep top 3.
      const perCategory: Array<{ cfg: (typeof CATEGORIES)[number]; ranked: Array<{ playerId: string; value: number }> }> =
        CATEGORIES.map((cfg) => {
          const ranked = rows
            .filter((r) => {
              const v = r[cfg.column];
              return typeof v === 'number' && Number.isFinite(v);
            })
            .map((r) => ({ playerId: r.player_id, value: r[cfg.column] as number }))
            .sort((a, b) => (cfg.order === 'asc' ? a.value - b.value : b.value - a.value))
            .slice(0, 3);
          return { cfg, ranked };
        });

      const playerIds = Array.from(
        new Set(perCategory.flatMap(({ ranked }) => ranked.map((r) => r.playerId))),
      );
      const playerMap = new Map<string, { name: string; photoUrl: string | null; headshotOverride: string | null }>();
      if (playerIds.length > 0) {
        const { data: players, error: pErr } = await supabase
          .from('sr_players')
          .select('id, full_name, photo_url, headshot_override')
          .in('id', playerIds);
        if (pErr) {
          // eslint-disable-next-line no-console
          console.error('[stat-watch] sr_players fetch failed:', pErr);
        } else {
          (players ?? []).forEach((p: any) =>
            playerMap.set(p.id, {
              name: p.full_name,
              photoUrl: p.photo_url ?? null,
              headshotOverride: p.headshot_override ?? null,
            }),
          );
        }
      }

      const categories: StatCategory[] = perCategory
        .map(({ cfg, ranked }) => {
          const leaders: StatLeader[] = ranked
            .map((r) => {
              const p = playerMap.get(r.playerId);
              if (!p) return null;
              return {
                playerId: r.playerId,
                playerName: p.name,
                photoUrl: p.photoUrl,
                headshotOverride: p.headshotOverride,
                value: r.value,
              };
            })
            .filter((r): r is StatLeader => !!r);
          return {
            key: cfg.key,
            label: cfg.label,
            unit: cfg.unit,
            order: cfg.order,
            format: cfg.format,
            leaders,
          };
        })
        .filter((c) => c.leaders.length > 0);

      return { categories };
    },
  });
}
