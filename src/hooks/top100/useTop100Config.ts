import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { VerdictConfig } from '@/components/top100/verdict';

export interface Top100Config extends VerdictConfig {
  /** Minimum member ratings before the four sub-score bars are shown. */
  subscoreMinRatings: number;
  /** Minimum courses played on the active list before the progress panel renders. */
  minPlayed: number;
}

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
  't100_verdict_anchor',
  't100_verdict_slope',
  't100_subscore_min_ratings',
  't100_progress_min_played',
] as const;

const FALLBACK: Top100Config = {
  enabled: false,
  minRatings: 3,
  threshold: 0.5,
  anchor: 9.36,
  slope: 0.01,
  subscoreMinRatings: 3,
  minPlayed: 5,
};


export function useTop100Config(): Top100Config {
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
    anchor: data.t100_verdict_anchor ?? FALLBACK.anchor,
    slope: data.t100_verdict_slope ?? FALLBACK.slope,
    subscoreMinRatings: data.t100_subscore_min_ratings ?? FALLBACK.subscoreMinRatings,
    minPlayed: data.t100_progress_min_played ?? FALLBACK.minPlayed,
  };
}
