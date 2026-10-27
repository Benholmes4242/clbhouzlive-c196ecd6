/**
 * CB112 — "Courses near" (get_nearby_courses within 16 km, limit 100) and
 * "Top 100 near" (distinct of those with a course_top100_memberships row).
 * Enabled only for the nearby categories with a map pin; a failed read
 * yields null so the strip skips the cell rather than printing a zero.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NEARBY_CATEGORIES } from '@/lib/business/businessHero';

export function useBusinessNearbyCounts(category: string | null | undefined, lat: number | null | undefined, lng: number | null | undefined) {
  const enabled = NEARBY_CATEGORIES.has(category ?? '') && lat != null && lng != null;
  return useQuery({
    queryKey: ['business-nearby-counts', lat, lng],
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<{ coursesNear: number | null; top100Near: number | null }> => {
      const { data, error } = await supabase.rpc('get_nearby_courses', {
        p_user_lat: lat as number, p_user_lng: lng as number, p_radius_km: 16, p_limit: 100,
      });
      if (error) return { coursesNear: null, top100Near: null };
      const ids = Array.from(new Set(((data ?? []) as Array<{ course_id: string }>).map((r) => r.course_id)));
      if (ids.length === 0) return { coursesNear: 0, top100Near: 0 };
      const { data: m, error: mErr } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', ids);
      const top100Near = mErr ? null : new Set(((m ?? []) as Array<{ course_id: string }>).map((r) => r.course_id)).size;
      return { coursesNear: ids.length, top100Near };
    },
  });
}
