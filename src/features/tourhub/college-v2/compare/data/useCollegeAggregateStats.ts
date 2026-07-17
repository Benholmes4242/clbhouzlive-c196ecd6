/**
 * useCollegeAggregateStats — per-college alumni averages for the head-to-head
 * "deeper tugs" (Scoring Avg, Driving Distance, SG: Total).
 *
 * Only alumni whose season stats include the given key contribute to that
 * key's mean. `coverage` reports players-with-stat / alumni-total so the UI
 * (or the ship report) can flag thin coverage. All values are pulled from
 * `sr_player_statistics.raw_data.statistics.*` for the current season.
 *
 * Verified keys (see raw_data.statistics inventory): scoring_avg, drive_avg,
 * strokes_gained_total.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from '@/features/tourhub/hooks/useCollegeStats';

export interface CollegeAggregate {
  value: number;
  coverage: { with: number; total: number };
}

export interface CollegeAggregates {
  scoringAvg: CollegeAggregate | null;
  drivingDistance: CollegeAggregate | null;
  sgTotal: CollegeAggregate | null;
  alumniTotal: number;
}

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  let s = 0;
  for (const n of nums) s += n;
  return s / nums.length;
}

function pickNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function useCollegeAggregateStats(normalizedName: string | undefined) {
  const seasonId = useCurrentSeasonId();

  return useQuery<CollegeAggregates>({
    queryKey: ['college-v2', 'aggregates', normalizedName ?? 'none', seasonId ?? 'none'],
    enabled: !!normalizedName,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const empty: CollegeAggregates = {
        scoringAvg: null,
        drivingDistance: null,
        sgTotal: null,
        alumniTotal: 0,
      };
      if (!normalizedName) return empty;

      const { data: players } = await supabase
        .from('sr_players')
        .select('id')
        .eq('college_normalized', normalizedName);
      if (!players?.length) return empty;
      const ids = players.map((p) => p.id);
      const total = ids.length;

      if (!seasonId) return { ...empty, alumniTotal: total };

      const { data: stats } = await supabase
        .from('sr_player_statistics')
        .select('player_id, raw_data')
        .eq('season_id', seasonId)
        .in('player_id', ids);

      const scoring: number[] = [];
      const drive: number[] = [];
      const sg: number[] = [];

      for (const row of stats ?? []) {
        const raw = (row.raw_data ?? {}) as Record<string, unknown>;
        const s = (raw.statistics ?? {}) as Record<string, unknown>;
        const sa = pickNumber(s.scoring_avg);
        const da = pickNumber(s.drive_avg);
        const sgt = pickNumber(s.strokes_gained_total);
        if (sa != null && sa > 0) scoring.push(sa);
        if (da != null && da > 0) drive.push(da);
        if (sgt != null) sg.push(sgt);
      }

      return {
        scoringAvg: scoring.length
          ? { value: mean(scoring), coverage: { with: scoring.length, total } }
          : null,
        drivingDistance: drive.length
          ? { value: mean(drive), coverage: { with: drive.length, total } }
          : null,
        sgTotal: sg.length
          ? { value: mean(sg), coverage: { with: sg.length, total } }
          : null,
        alumniTotal: total,
      };
    },
  });
}
