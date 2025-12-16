import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockBusinessActivityPosts, MOCK_BUSINESS_ID } from '@/mocks/mockBusinessActivity';

// Check if mock mode is enabled (dev/preview only)
const MOCK_MODE_ENABLED = import.meta.env.VITE_MOCK_BUSINESS_ACTIVITY === 'true';

export interface BusinessPost {
  id: string;
  content: string | null;
  created_at: string;
  updated_at?: string;
  user_id: string;
  actor_type?: string | null;
  actor_id?: string | null;
  post_type?: string | null;
  location?: string | null;
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    poster_url?: string | null;
    width?: number;
    height?: number;
    duration?: number;
  }>;
  likes_count: number;
  comments_count: number;
}

// Helper to check if mock mode should apply for this business
export function isMockModeActive(businessId?: string): boolean {
  return MOCK_MODE_ENABLED && businessId === MOCK_BUSINESS_ID;
}

export function useBusinessPosts(businessId?: string) {
  const mockActive = isMockModeActive(businessId);

  return useQuery({
    queryKey: ['business-posts', businessId, mockActive ? 'mock' : 'real'],
    enabled: !!businessId,
    queryFn: async () => {
      // If mock mode active, return mock data directly
      if (mockActive) {
        console.log('[useBusinessPosts] Mock mode active - returning mock data');
        return mockBusinessActivityPosts.map(post => ({
          ...post,
          content: post.content,
          updated_at: post.created_at,
          actor_type: 'business',
          actor_id: post.business_id,
        })) as BusinessPost[];
      }

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
