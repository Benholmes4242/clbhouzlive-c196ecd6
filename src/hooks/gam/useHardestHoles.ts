import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Scoring spread for a hole, as percentages (0-100, one decimal). */
export interface HoleScoreDistribution {
  birdie_plus: number;
  par: number;
  bogey: number;
  double_plus: number;
}

export interface HardestHoleRow {
  course_id: string;
  course_name: string;
  course_image: string | null;
  region: string | null;
  country: string | null;
  hole_no: number;
  par: number;
  plays_to: number;
  avg_over: number;
  rounds: number;
  /** Present on every row in the live cache; render defensively if absent. */
  dist: HoleScoreDistribution;
}

export type HoleIndexMode = 'hardest' | 'easiest';

/**
 * Reads the precomputed 'hardest_holes' / 'easiest_holes' rail from
 * discover_rail_cache. Refreshed daily by cron.
 */
export function useHardestHoles(mode: HoleIndexMode = 'hardest') {
  const railKey = mode === 'easiest' ? 'easiest_holes' : 'hardest_holes';
  return useQuery<HardestHoleRow[]>({
    queryKey: ['gam', 'hole-index-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as HardestHoleRow[];
    },
  });
}
