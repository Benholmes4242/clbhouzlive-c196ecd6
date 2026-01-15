import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseCreatorActivityPostsParams {
  creatorPageId?: string;
  enabled?: boolean;
}

/**
 * Fetch posts created BY a creator page (Activity tab)
 * Uses actor_type='creator' and actor_id=creatorPageId
 */
export function useCreatorActivityPosts({ creatorPageId, enabled = true }: UseCreatorActivityPostsParams) {
  return useInfiniteQuery({
    queryKey: ['creator-activity-posts', creatorPageId],
    enabled: enabled && !!creatorPageId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 20;
      const startRange = pageParam * PAGE_SIZE;
      const endRange = startRange + PAGE_SIZE - 1;

      console.log('[useCreatorActivityPosts] Fetching for:', creatorPageId, 'page:', pageParam);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          visibility,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            duration_seconds,
            width,
            height
          ),
          post_likes (count),
          post_views (count)
        `)
        .eq('actor_type', 'creator')
        .eq('actor_id', creatorPageId!)
        .eq('status', 'published')
        .eq('visibility', 'anyone')
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) {
        console.error('[useCreatorActivityPosts] Error:', error);
        throw error;
      }
      
      console.log('[useCreatorActivityPosts] Fetched:', data?.length || 0, 'posts');
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
  });
}

/**
 * Fetch posts that TAG a creator page (Tagged tab)
 * Queries post_tags where the entity is this creator page
 */
export function useCreatorTaggedPosts({ creatorPageId, enabled = true }: UseCreatorActivityPostsParams) {
  return useInfiniteQuery({
    queryKey: ['creator-tagged-posts', creatorPageId],
    enabled: enabled && !!creatorPageId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const PAGE_SIZE = 20;
      const startRange = pageParam * PAGE_SIZE;
      const endRange = startRange + PAGE_SIZE - 1;

      console.log('[useCreatorTaggedPosts] Fetching for:', creatorPageId, 'page:', pageParam);

      // First get post IDs that tag this creator page
      const { data: tagData, error: tagError } = await supabase
        .from('post_tags')
        .select('post_id, taggable_entities!inner(entity_type, entity_id)')
        .eq('taggable_entities.entity_type', 'creator_page')
        .eq('taggable_entities.entity_id', creatorPageId!)
        .range(startRange, endRange);

      if (tagError) {
        console.error('[useCreatorTaggedPosts] Tag query error:', tagError);
        return [];
      }

      if (!tagData || tagData.length === 0) {
        return [];
      }

      const postIds = tagData.map(t => t.post_id);

      // Fetch the actual posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          post_media (
            id,
            media_url,
            media_type,
            poster_url,
            duration_seconds,
            width,
            height
          ),
          post_likes (count),
          post_views (count)
        `)
        .in('id', postIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useCreatorTaggedPosts] Posts query error:', error);
        return [];
      }
      
      console.log('[useCreatorTaggedPosts] Fetched:', data?.length || 0, 'posts');
      return data || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
  });
}
