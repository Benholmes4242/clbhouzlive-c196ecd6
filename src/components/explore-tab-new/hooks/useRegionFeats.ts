import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FeatTier = 'legendary' | 'eagles' | 'birdie_hauls' | 'records';

export interface FeatRow {
  course_name: string;
  course_image: string | null;
  holder_name: string | null;
  holder_username?: string | null;
  holder_avatar: string | null;
  holder_hcp?: number | null;
  holder_club?: string | null;
  feat_type?: string;
  feat_value?: string;
  play_date?: string;
  score_id?: string;
  user_id?: string;
  course_id?: string;
  // records-only
  category?: string;
  value?: number | string;
  attained_at?: string;
  thumbnail_image?: string | null;
  course_par?: number | null;
}

const CACHE_REGION: Record<string, string> = {
  usa: 'usa',
  'uk-ireland': 'gbi',
  'continental-europe': 'europe',
  'rest-of-world': 'row',
};

export function toCacheRegion(r: string | null): string {
  return r ? CACHE_REGION[r] ?? 'worldwide' : 'worldwide';
}

export function useRegionFeats(region: string | null, tier: FeatTier) {
  const cacheRegion = toCacheRegion(region);
  const railKey =
    tier === 'records'
      ? `records:${cacheRegion}`
      : `feats:${cacheRegion}:${tier}`;

  return useQuery<FeatRow[]>({
    queryKey: ['discover-rail-cache', railKey],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) throw error;
      return (data?.payload ?? []) as unknown as FeatRow[];
    },
  });
}
