import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useCourseLatestRatings — the newest review per course inside the wire's
 * horizon, for the "Rated {x} by a member" event line on Around the world.
 *
 * Verified cheap: course_ratings is a small table and the read is scoped to the
 * course ids already grouped on screen, so no new query family is introduced.
 */
export function useCourseLatestRatings(courseIds: string[], windowDays = 90) {
  const key = Array.from(new Set(courseIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['courseled', 'latest-ratings', windowDays, key.join('|')],
    queryFn: async (): Promise<Map<string, { rating: number; at: string }>> => {
      const out = new Map<string, { rating: number; at: string }>();
      if (key.length === 0) return out;
      const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('course_ratings')
        .select('course_id, rating, created_at')
        .in('course_id', key)
        .eq('is_mock', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;
      for (const r of (data ?? []) as Array<{
        course_id: string;
        rating: number;
        created_at: string;
      }>) {
        if (out.has(r.course_id)) continue;
        out.set(r.course_id, { rating: Number(r.rating), at: r.created_at });
      }
      return out;
    },
    enabled: key.length > 0,
    staleTime: 15 * 60 * 1000,
  });
}
