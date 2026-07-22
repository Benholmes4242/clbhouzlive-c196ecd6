import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

/**
 * Reads the precomputed 'hardest_holes' rail from discover_rail_cache.
 * Refreshed daily by cron.
 */
export function useHardestHoles() {
  return useQuery<HardestHoleRow[]>({
    queryKey: ['gam', 'hardest-holes-cache'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', 'hardest_holes')
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as HardestHoleRow[];
    },
  });
}
