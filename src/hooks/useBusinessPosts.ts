import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export function useBusinessPosts(businessId?: string) {
  const queryClient = useQueryClient();

  // Listen for postCompleted events to invalidate immediately
  useEffect(() => {
    if (!businessId) return;

    const handlePostCompleted = (event: CustomEvent<{ realPost?: { actor_type?: string; actor_id?: string } }>) => {
      const post = event.detail?.realPost;
      if (post?.actor_type === 'business' && post?.actor_id === businessId) {
        queryClient.invalidateQueries({ queryKey: ['actor-posts', 'business', businessId] });
        queryClient.invalidateQueries({ queryKey: ['actor-posts-count', 'business', businessId] });
      }
    };

    window.addEventListener('postCompleted', handlePostCompleted as EventListener);
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted as EventListener);
    };
  }, [businessId, queryClient]);

  return useQuery({
    queryKey: ['actor-posts', 'business', businessId],
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

export function useBusinessPostsCount(businessId?: string) {
  return useQuery({
    queryKey: ['actor-posts-count', 'business', businessId],
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
