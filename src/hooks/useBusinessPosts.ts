import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessPost {
  id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  actor_type: string | null;
  actor_id: string | null;
  post_type?: string | null;
  location?: string | null;
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url: string | null;
  }>;
  likes_count: number;
  comments_count: number;
}

export function useBusinessPosts(businessId?: string) {
  return useQuery({
    queryKey: ['business-posts', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      // Fetch posts with media
      const { data: postsData, error: postsError } = await supabase
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

      if (postsError) {
        console.error('[useBusinessPosts] error', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        return [] as BusinessPost[];
      }

      // Fetch likes counts for all posts
      const postIds = postsData.map(p => p.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);

      // Fetch comments counts for all posts
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);

      // Count likes and comments per post
      const likesCountMap = new Map<string, number>();
      const commentsCountMap = new Map<string, number>();
      
      likesData?.forEach(like => {
        likesCountMap.set(like.post_id, (likesCountMap.get(like.post_id) || 0) + 1);
      });
      
      commentsData?.forEach(comment => {
        commentsCountMap.set(comment.post_id, (commentsCountMap.get(comment.post_id) || 0) + 1);
      });

      // Merge counts into posts
      const postsWithCounts: BusinessPost[] = postsData.map(post => ({
        ...post,
        post_type: null, // Can be extended when post_type column exists
        location: null, // Can be extended when location column exists
        likes_count: likesCountMap.get(post.id) || 0,
        comments_count: commentsCountMap.get(post.id) || 0,
      }));

      return postsWithCounts;
    },
    staleTime: 60_000,
  });
}

export function useBusinessPostsCount(businessId?: string) {
  return useQuery({
    queryKey: ['business-posts-count', businessId],
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
