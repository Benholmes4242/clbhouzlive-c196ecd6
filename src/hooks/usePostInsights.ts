/**
 * Hook for post insights (views, likes, comments)
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PostInsights {
  views: number;
  likes: number;
  comments: number;
}

export function usePostInsights(postId: string | undefined) {
  return useQuery({
    queryKey: ['post-insights', postId],
    queryFn: async (): Promise<PostInsights> => {
      if (!postId) return { views: 0, likes: 0, comments: 0 };

      // Fetch all counts in parallel
      const [viewsResult, likesResult, commentsResult] = await Promise.all([
        supabase
          .from('post_views')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId),
        supabase
          .from('post_likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId),
        supabase
          .from('post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', postId),
      ]);

      return {
        views: viewsResult.count || 0,
        likes: likesResult.count || 0,
        comments: commentsResult.count || 0,
      };
    },
    enabled: !!postId,
    staleTime: 60 * 1000,
  });
}

export async function trackPostView(postId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase
    .from('post_views')
    .insert({
      post_id: postId,
      viewer_id: user?.id || null,
    });
}
