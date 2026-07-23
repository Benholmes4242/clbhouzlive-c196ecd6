import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useCourseRegularHolder(golfCourseId)
 *
 * Reads rail key `course_regular:{golf_course_id}` from `discover_rail_cache`
 * using the same pattern as `useRegionFeats`. Payload contract per
 * BRIEF_G2_CLIENT_AND_EDGE:
 *   { user_id, display_name, username, rounds_90d, held_since }
 *
 * The SQL that populates this row is authored separately; the client
 * treats missing rows as "no crown holder" and renders nothing.
 */

export interface CourseRegularHolder {
  user_id: string;
  display_name: string | null;
  username: string | null;
  rounds_90d: number;
  held_since: string | null;
}

export function useCourseRegularHolder(golfCourseId: string | null | undefined) {
  const railKey = golfCourseId ? `course_regular:${golfCourseId}` : null;
  return useQuery<CourseRegularHolder | null>({
    queryKey: ['discover-rail-cache', 'course_regular', golfCourseId],
    enabled: !!railKey,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!railKey) return null;
      const { data, error } = await supabase
        .from('discover_rail_cache')
        .select('payload')
        .eq('rail_key', railKey)
        .maybeSingle();
      if (error) return null;
      const p: any = data?.payload;
      if (!p || !p.user_id) return null;
      const rounds = Number(p.rounds_90d ?? 0);
      if (!Number.isFinite(rounds) || rounds < 3) return null;
      return {
        user_id: String(p.user_id),
        display_name: p.display_name ?? null,
        username: p.username ?? null,
        rounds_90d: rounds,
        held_since: p.held_since ?? null,
      };
    },
  });
}

export default useCourseRegularHolder;
