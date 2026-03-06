import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegionChip {
  slug: string | null;
  title: string;
}

export function useExploreRegionChips() {
  const query = useQuery({
    queryKey: ['explore-regions'],
    queryFn: async (): Promise<RegionChip[]> => {
      const { data, error } = await supabase
        .from('explore_regions')
        .select('slug, title')
        .order('sort_order');

      if (error) {
        console.error('[ExploreRegionChips] error:', error);
        return [{ slug: null, title: 'All' }];
      }

      const chips: RegionChip[] = [
        { slug: null, title: 'All' },
        ...(data ?? []).map(r => ({ slug: r.slug, title: r.title })),
      ];

      return chips;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    regions: query.data ?? [{ slug: null, title: 'All' }],
    isLoading: query.isLoading,
  };
}
