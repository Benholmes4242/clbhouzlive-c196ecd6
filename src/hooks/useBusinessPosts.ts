import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { postKeys } from '@/queryKeys/posts';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

export interface BusinessPost {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  actor_type: string | null;
  actor_id: string | null;
  course_id: string | null;
  is_pinned: boolean | null;
  pinned_until: string | null;
  pinned_at: string | null;
  badges?: string[];
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
    studio_edits: any;
  }>;
}

/**
 * Fetches posts for a business profile.
 * Cache invalidation is handled globally by PostEventsBridge.
 */
export function useBusinessPosts(businessId?: string) {
  return useQuery({
    // v2: Added studio_edits to query, bust cache to get fresh data
    queryKey: [...postKeys.actorPosts('business', businessId ?? ''), 'v2'],
    enabled: !!businessId,
    queryFn: async () => {
      // Get current user for visibility filtering
      const { data: { user } } = await supabase.auth.getUser();
      const visibilityFilter = buildVisibilityFilter(user?.id ?? null);
      
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
          course_id,
          is_pinned,
          pinned_until,
          pinned_at,
          badges,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            studio_edits
          )
        `)
        .eq('actor_type', 'business')
        .eq('actor_id', businessId!)
        .eq('status', 'published') // Only show published posts
        .or(visibilityFilter) // Apply visibility filter
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
        .eq('actor_id', businessId!)
        .eq('status', 'published');

      if (error) {
        console.error('[useBusinessPostsCount] error', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
