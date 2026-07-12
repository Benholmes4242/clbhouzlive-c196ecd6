/**
 * useHoleAggregates — TD1 course stats aggregated across played rounds.
 * Delegates to sr_hole_statistics; returns 18 canonical rows w/ mean par,
 * mean yardage, mean scoring_average across rounds. Empty when the event
 * lacks stats coverage — the section self-hides.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HoleAgg {
  hole: number;
  par: number | null;
  yardage: number | null;
  avg: number | null;
  diff: number | null;
}

export function useHoleAggregates(tournamentId: string | null | undefined) {
  return useQuery<HoleAgg[]>({
    queryKey: ['tournament-v2', 'hole-aggs', tournamentId],
    enabled: !!tournamentId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!tournamentId) return [];
      const { data, error } = await supabase
        .from('sr_hole_statistics')
        .select('hole_number, par, yardage, scoring_average')
        .eq('tournament_id', tournamentId);
      if (error) {
        console.error('[tournament-v2] useHoleAggregates', error);
        return [];
      }
      const buckets = new Map<number, { par: number[]; yds: number[]; avg: number[] }>();
      for (const r of (data ?? []) as any[]) {
        const b = buckets.get(r.hole_number) ?? { par: [], yds: [], avg: [] };
        if (r.par != null) b.par.push(r.par);
        if (r.yardage != null) b.yds.push(r.yardage);
        if (r.scoring_average != null) b.avg.push(r.scoring_average);
        buckets.set(r.hole_number, b);
      }
      const out: HoleAgg[] = [];
      for (let h = 1; h <= 18; h++) {
        const b = buckets.get(h);
        if (!b) { out.push({ hole: h, par: null, yardage: null, avg: null, diff: null }); continue; }
        const mean = (xs: number[]) => xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : null;
        const par = mean(b.par);
        const avg = mean(b.avg);
        out.push({
          hole: h,
          par: par != null ? Math.round(par) : null,
          yardage: mean(b.yds) != null ? Math.round(mean(b.yds)!) : null,
          avg,
          diff: par != null && avg != null ? avg - par : null,
        });
      }
      return out;
    },
  });
}
