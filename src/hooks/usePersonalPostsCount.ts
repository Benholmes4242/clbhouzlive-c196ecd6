import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';

/**
 * Fetches total post count for a personal (user) profile.
 * Uses count-only query for efficiency.
 * Cache invalidation is handled globally by PostEventsBridge.
 */
export function usePersonalPostsCount(userId?: string) {
  return useQuery({
    queryKey: postKeys.actorPostsCount('personal', userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('actor_type', 'personal')
        .eq('actor_id', userId!)
        .is('source_review_id', null); // Exclude review posts — counted separately

      if (error) {
        console.error('[usePersonalPostsCount] error', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
