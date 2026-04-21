import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

/**
 * Returns the set of post IDs the current user has watched
 * (any signal_type IN ('watched_partial', 'watched_complete')).
 *
 * Used to filter the "NEW" badge so it disappears for users who
 * have already seen a post — but stays visible to those who haven't.
 *
 * - Cached via React Query, 5 min staleTime.
 * - Single shared subscription across all tile/rail consumers.
 * - Graceful degradation: any error → empty Set (badge shows as before).
 */
export function useViewedPostIds() {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  return useQuery<Set<string>>({
    queryKey: ['viewed-post-ids', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!userId) return new Set<string>();

      const { data, error } = await supabase
        .from('user_content_preferences')
        .select('post_id')
        .eq('user_id', userId)
        .in('signal_type', ['watched_partial', 'watched_complete']);

      if (error) {
        console.error('[useViewedPostIds] fetch error:', error);
        return new Set<string>();
      }

      return new Set<string>(
        (data ?? [])
          .map((row) => row.post_id)
          .filter((id): id is string => !!id),
      );
    },
  });
}
