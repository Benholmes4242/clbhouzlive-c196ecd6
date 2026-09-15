import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';
import { ROUND_POST_TYPE } from '@/lib/posts/isRoundPost';

/**
 * Fetches total post count for a personal (user) profile.
 *
 * THE COUNT COUNTS WHAT THE GRID CAN SHOW. get_profile_posts (deployed)
 * requires status = 'published' AND at least one post_media row, and rounds are
 * media-less, so a count without those filters reported posts the grid could
 * never render — 22 members saw a number the grid contradicted. The three
 * filters here mirror that function exactly:
 *   status = 'published'  ·  a post_media row exists  ·  post_type <> 'round'
 *
 * The media requirement is expressed as an inner join and de-duplicated in JS:
 * an exact head count over a join counts JOINED ROWS (one per media item), so a
 * three-photo post would count three times.
 *
 * source_review_id IS NULL stays: review posts are counted separately on the
 * profile and that predates this change. get_profile_posts DOES return them, so
 * this one filter is deliberately narrower than the grid.
 */
export function usePersonalPostsCount(userId?: string) {
  return useQuery({
    queryKey: postKeys.actorPostsCount('personal', userId ?? ''),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, post_media!inner(post_id)')
        .eq('actor_type', 'personal')
        .eq('actor_id', userId!)
        .eq('status', 'published')
        .neq('post_type', ROUND_POST_TYPE)
        .is('source_review_id', null) // Exclude review posts — counted separately
        .limit(5000);

      if (error) {
        console.error('[usePersonalPostsCount] error', error);
        throw error;
      }

      const ids = new Set((data ?? []).map((row) => (row as { id: string }).id));
      return ids.size;
    },
    staleTime: 60_000,
  });
}
