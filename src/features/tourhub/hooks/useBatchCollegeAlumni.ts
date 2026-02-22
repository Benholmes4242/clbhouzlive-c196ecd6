import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AlumniFace {
  id: string;
  full_name: string;
  photo_url: string | null;
  pga_tour_id: string | null;
  tour_codes: string[] | null;
  college_normalized: string;
}

/**
 * Batch-fetches top alumni with photos for multiple colleges at once.
 * Returns a Map<normalized_name, AlumniFace[]> with up to `perCollege` players each.
 */
export function useBatchCollegeAlumni(collegeSlugs: string[], perCollege = 3) {
  return useQuery({
    queryKey: ['batch-college-alumni', collegeSlugs, perCollege],
    queryFn: async () => {
      if (!collegeSlugs.length) return new Map<string, AlumniFace[]>();

      const { data, error } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, photo_url, pga_tour_id, tour_codes, college_normalized')
        .in('college_normalized', collegeSlugs)
        .not('photo_url', 'is', null)
        .limit(collegeSlugs.length * (perCollege + 2));

      if (error) {
        console.error('[useBatchCollegeAlumni] Error:', error);
        return new Map<string, AlumniFace[]>();
      }

      const grouped = new Map<string, AlumniFace[]>();
      (data || []).forEach(p => {
        const key = p.college_normalized;
        if (!key) return;
        const list = grouped.get(key) || [];
        if (list.length < perCollege) {
          list.push({
            id: p.id,
            full_name: `${p.first_name} ${p.last_name}`,
            photo_url: p.photo_url,
            pga_tour_id: p.pga_tour_id || null,
            tour_codes: (p as any).tour_codes ?? null,
            college_normalized: key,
          });
          grouped.set(key, list);
        }
      });

      return grouped;
    },
    enabled: collegeSlugs.length > 0,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches alumni with photos for the hero strip (up to 8 for a single college).
 */
export function useHeroAlumni(normalizedName: string | undefined) {
  return useQuery({
    queryKey: ['hero-alumni', normalizedName],
    queryFn: async () => {
      if (!normalizedName) return [];

      const { data, error } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, photo_url, pga_tour_id, college_normalized')
        .eq('college_normalized', normalizedName)
        .not('photo_url', 'is', null)
        .limit(8);

      if (error) {
        console.error('[useHeroAlumni] Error:', error);
        return [];
      }

      return (data || []).map(p => ({
        id: p.id,
        full_name: `${p.first_name} ${p.last_name}`,
        photo_url: p.photo_url,
        pga_tour_id: p.pga_tour_id || null,
        college_normalized: p.college_normalized || '',
      })) as AlumniFace[];
    },
    enabled: !!normalizedName,
    staleTime: 10 * 60 * 1000,
  });
}
