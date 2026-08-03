/**
 * Career-record display thresholds, read from feed_config so they can be
 * tuned without a release.
 *
 * gam_share_min_denominator  no share renders anywhere below this member count
 * top100_share_floor         no Top 100 share renders below this played count
 * top100_rank_crossover      above this played count the share stops
 *                            discriminating and an ordinal reads better
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GamRecordConfig {
  shareMinDenominator: number;
  top100ShareFloor: number;
  top100RankCrossover: number;
}

export const RECORD_CONFIG_DEFAULTS: GamRecordConfig = {
  shareMinDenominator: 100,
  top100ShareFloor: 5,
  top100RankCrossover: 10,
};

const KEYS = [
  'gam_share_min_denominator',
  'top100_share_floor',
  'top100_rank_crossover',
] as const;

export function useGamRecordConfig() {
  return useQuery({
    queryKey: ['gam', 'record-config'],
    staleTime: 6 * 60 * 60 * 1000,
    queryFn: async (): Promise<GamRecordConfig> => {
      const { data, error } = await supabase
        .from('feed_config')
        .select('key, value')
        .in('key', KEYS as unknown as string[]);
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) {
        const n = Number(row.value);
        if (Number.isFinite(n)) map.set(row.key, n);
      }
      return {
        shareMinDenominator:
          map.get('gam_share_min_denominator') ?? RECORD_CONFIG_DEFAULTS.shareMinDenominator,
        top100ShareFloor:
          map.get('top100_share_floor') ?? RECORD_CONFIG_DEFAULTS.top100ShareFloor,
        top100RankCrossover:
          map.get('top100_rank_crossover') ?? RECORD_CONFIG_DEFAULTS.top100RankCrossover,
      };
    },
  });
}

export default useGamRecordConfig;
