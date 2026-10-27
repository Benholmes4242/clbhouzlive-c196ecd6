/**
 * CB112 — "Courses near" (get_nearby_courses within 16 km, limit 100) and
 * "Top 100 near" (distinct of those with a course_top100_memberships row).
 * Enabled only for the nearby categories with a map pin; a failed read
 * yields null so the strip skips the cell rather than printing a zero.
 * CB113: also returns the nearby course ids/names from the SAME query and
 * key, so BusinessYouCard's N always equals the hero's Courses near.
 * CB114: each course also carries distance_km, thumbnail_image, rating_avg,
 * review_count (same RPC, nearest first, first row per id) and isTop100
 * (from the memberships read already made) for BusinessNearbyCourses.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { NEARBY_CATEGORIES } from '@/lib/business/businessHero';

/** One key for hero and BusinessYouCard (CB113). */
export const nearbyCountsKey = (lat: number | null | undefined, lng: number | null | undefined) => ['business-nearby-counts', lat, lng] as const;

export interface NearbyCourse { id: string; name: string; distanceKm: number | null; thumbnail: string | null; ratingAvg: number | null; reviewCount: number; isTop100: boolean }
export interface NearbyCounts { coursesNear: number | null; top100Near: number | null; courses: NearbyCourse[] | null }

export function useBusinessNearbyCounts(category: string | null | undefined, lat: number | null | undefined, lng: number | null | undefined) {
  const enabled = NEARBY_CATEGORIES.has(category ?? '') && lat != null && lng != null;
  return useQuery({
    queryKey: nearbyCountsKey(lat, lng),
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<NearbyCounts> => {
      const { data, error } = await supabase.rpc('get_nearby_courses', {
        p_user_lat: lat as number, p_user_lng: lng as number, p_radius_km: 16, p_limit: 100,
      });
      if (error) return { coursesNear: null, top100Near: null, courses: null };
      const courses: NearbyCourse[] = [];
      const seen = new Set<string>();
      type Row = { course_id: string; course_name?: string | null; distance_km?: number | null; thumbnail_image?: string | null; rating_avg?: number | null; review_count?: number | null };
      const num = (v: unknown) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
      for (const r of (data ?? []) as Row[]) {
        if (seen.has(r.course_id)) continue;
        seen.add(r.course_id);
        courses.push({
          id: r.course_id, name: r.course_name ?? '', distanceKm: num(r.distance_km),
          thumbnail: r.thumbnail_image || null, ratingAvg: num(r.rating_avg), reviewCount: num(r.review_count) ?? 0, isTop100: false,
        });
      }
      const ids = courses.map((c) => c.id);
      if (ids.length === 0) return { coursesNear: 0, top100Near: 0, courses };
      const { data: m, error: mErr } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', ids);
      const members = new Set(((m ?? []) as Array<{ course_id: string }>).map((r) => r.course_id));
      const top100Near = mErr ? null : members.size;
      if (!mErr) for (const c of courses) c.isTop100 = members.has(c.id);
      return { coursesNear: ids.length, top100Near, courses };
    },
  });
}
