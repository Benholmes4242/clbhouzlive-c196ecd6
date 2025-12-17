import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';

export interface BusinessPost {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  actor_type: string | null;
  actor_id: string | null;
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
  }>;
}

/**
 * Fetches posts for a business profile.
 * Cache invalidation is handled globally by PostEventsBridge.
 */
export function useBusinessPosts(businessId?: string) {
  return useQuery({
    queryKey: postKeys.actorPosts('business', businessId ?? ''),
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          actor_type,
          actor_id,
          post_media (
            id,
            media_url,
            media_type,
            poster_url
          )
        `)
        .eq('actor_type', 'business')
        .eq('actor_id', businessId!)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useBusinessPosts] error', error);
        throw error;
      }

      return (data ?? []) as BusinessPost[];
    },
    staleTime: 5_000,
  });
}

/**
 * Fetches post count for a business profile.
 * Cache invalidation is handled globally by PostEventsBridge.
 */
export function useBusinessPostsCount(businessId?: string) {
  return useQuery({
    queryKey: postKeys.actorPostsCount('business', businessId ?? ''),
    enabled: !!businessId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('actor_type', 'business')
        .eq('actor_id', businessId!);

      if (error) {
        console.error('[useBusinessPostsCount] error', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
