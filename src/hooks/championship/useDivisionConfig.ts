import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DivisionConfig, DivisionSlug } from '@/types/championship';

// Map division_id to slug format
function toSlug(divisionId: string): DivisionSlug {
  // Convert "Rookie Club" -> "rookie-club"
  return divisionId.toLowerCase().replace(/\s+/g, '-') as DivisionSlug;
}

export function useDivisionConfig() {
  return useQuery({
    queryKey: ['division-config'],
    queryFn: async (): Promise<DivisionConfig[]> => {
      const { data, error } = await supabase.rpc('get_division_config');

      if (error) throw error;

      const divisions = (data || []) as Array<{
        display_name: string;
        division_id: string;
        ring_color: string;
        sort_order: number;
        threshold: number;
      }>;

      return divisions.map((d) => ({
        id: d.division_id,
        slug: toSlug(d.division_id),
        name: d.display_name,
        tier_order: d.sort_order,
        min_courses: d.threshold,
        max_courses: null, // Will be inferred from next tier's threshold
        color_hex: d.ring_color,
        icon_key: d.division_id.toLowerCase().replace(/\s+/g, '_'),
        promotion_zone_top_n: 3, // Default values
        relegation_zone_bottom_n: 3,
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - config rarely changes
  });
}
