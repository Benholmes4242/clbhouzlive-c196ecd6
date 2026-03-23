import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches total course review count for a personal (user) profile.
 * Counts from course_ratings (authoritative source), not posts.
 */
export function usePersonalReviewsCount(userId?: string) {
  return useQuery({
    queryKey: ['actor-reviews-count', 'personal', userId ?? ''],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('course_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_mock', false);

      if (error) {
        console.error('[usePersonalReviewsCount] error', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 0,
  });
}
