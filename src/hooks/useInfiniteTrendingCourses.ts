/**
 * useInfiniteTrendingCourses - Infinite scroll version of useTrendingCourses
 * Supports region filtering for the Courses sub-tab
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RegionKey } from '@/hooks/useExploreMoments';

const PAGE_SIZE = 20;

// Map region keys to country arrays
const REGION_COUNTRIES: Record<string, string[]> = {};

async function getRegionCountries(regionKey: RegionKey): Promise<string[]> {
  if (REGION_COUNTRIES[regionKey]) return REGION_COUNTRIES[regionKey];
  
  // Fetch region by matching region_key patterns
  const regionSlugMap: Record<RegionKey, string[]> = {
    'GBI': ['gb-ireland', 'uk-ireland'],
    'EU': ['continental-europe', 'europe'],
    'USA': ['usa', 'united-states'],
    'ROW': ['rest-of-world'],
  };

  const slugs = regionSlugMap[regionKey] || [];
  
  for (const slug of slugs) {
    const { data: region } = await supabase
      .from('explore_regions')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (region) {
      const { data: members } = await supabase
        .from('explore_region_members')
        .select('country')
        .eq('region_id', region.id);
      
      const countries = members?.map(m => m.country) || [];
      REGION_COUNTRIES[regionKey] = countries;
      return countries;
    }
  }
  
  return [];
}

export function useInfiniteTrendingCourses(regionKey?: RegionKey | 'all') {
  const effectiveRegion = regionKey && regionKey !== 'all' ? regionKey : undefined;

  return useInfiniteQuery({
    queryKey: ['infinite-trending-courses', effectiveRegion],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('golf_courses')
        .select('id, name, country, sub_country, thumbnail_image, global_rank, region_key')
        .not('thumbnail_image', 'is', null)
        .order('global_rank', { ascending: true, nullsFirst: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (effectiveRegion) {
        const countries = await getRegionCountries(effectiveRegion);
        if (countries.length > 0) {
          query = query.in('country', countries);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        courses: data || [],
        nextOffset: data && data.length === PAGE_SIZE ? pageParam + PAGE_SIZE : null,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 5 * 60 * 1000,
  });
}
