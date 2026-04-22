import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExploreRegionFull {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string | null;
  sort_order: number | null;
}

export function useExploreRegionsWithImages() {
  return useQuery({
    queryKey: ['explore-regions'],
    queryFn: async (): Promise<ExploreRegionFull[]> => {
      const { data, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, subtitle, hero_image_url, sort_order')
        .order('sort_order');

      if (error) {
        if (import.meta.env.DEV) console.error('[ExploreRegionsWithImages] fetch error:', error);
        return [];
      }

      return (data ?? []) as ExploreRegionFull[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
