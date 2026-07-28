import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VerdictConfig } from '@/components/top100/verdict';

/**
 * Reads the Top 100 verdict switches from public.feed_config.
 *
 * A single row update must be able to turn the whole feature off, so these
 * values are never hardcoded in components. Defaults below are only the
 * fallback used while the query is in flight or if a row is missing.
 */

const KEYS = [
  't100_verdict_enabled',
  't100_verdict_min_ratings',
  't100_verdict_threshold',
] as const;

const FALLBACK: VerdictConfig = {
  enabled: false,
  minRatings: 3,
  threshold: 0.5,
};

export function useTop100Config(): VerdictConfig {
  const { data } = useQuery({
    queryKey: ['top100-verdict-config'],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('feed_config')
        .select('key, value')
        .in('key', KEYS as unknown as string[]);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[row.key] = Number(row.value);
      return map;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!data) return FALLBACK;

  return {
    enabled: (data.t100_verdict_enabled ?? 0) === 1,
    minRatings: data.t100_verdict_min_ratings ?? FALLBACK.minRatings,
    threshold: data.t100_verdict_threshold ?? FALLBACK.threshold,
  };
}
