import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 10;

interface UseInfiniteBusinessPostsOptions {
  businessId?: string;
  filterType?: 'all' | 'longform' | 'shorts' | 'images';
}

export function useInfiniteBusinessPosts(options: UseInfiniteBusinessPostsOptions) {
  const { businessId, filterType = 'all' } = options;

  const query = useInfiniteQuery({
    queryKey: ['business-posts-infinite', businessId, filterType],
    initialPageParam: 0,
    enabled: !!businessId,
    
    queryFn: async ({ pageParam = 0 }) => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      console.log('[useInfiniteBusinessPosts] 🔍 QUERY:', {
        businessId,
        filterType,
        startRange,
        endRange
      });

      // Build base query
      let baseQuery = supabase
        .from('posts')
        .select(`
          id, content, created_at, actor_id, actor_type, user_id, visibility,
          post_media (
            id, media_type, media_url, duration_seconds,
            poster_url, width, height
          ),
          post_likes (count),
          post_views (count),
          post_comments!post_comments_post_id_fkey (count)
        `)
        .eq('actor_type', 'business')
        .eq('actor_id', businessId)
        .eq('visibility', 'anyone');

      // Apply media type filters
      if (filterType === 'longform') {
        baseQuery = baseQuery.not('post_media', 'is', null);
      } else if (filterType === 'shorts') {
        baseQuery = baseQuery.not('post_media', 'is', null);
      } else if (filterType === 'images') {
        baseQuery = baseQuery.not('post_media', 'is', null);
      }

      baseQuery = baseQuery
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      const { data: postsData, error } = await baseQuery;

      if (error) {
        console.error('[useInfiniteBusinessPosts] ❌ Error:', error);
        throw error;
      }

      // Client-side filtering for media type (Supabase nested filters are limited)
      let filteredPosts = postsData || [];
      
      if (filterType === 'longform') {
        filteredPosts = filteredPosts.filter(post => {
          const videos = post.post_media?.filter(m => m.media_type === 'video') || [];
          return videos.some(v => (v.duration_seconds || 0) >= 240);
        });
      } else if (filterType === 'shorts') {
        filteredPosts = filteredPosts.filter(post => {
          const videos = post.post_media?.filter(m => m.media_type === 'video') || [];
          return videos.some(v => {
            const duration = v.duration_seconds || 0;
            return duration > 0 && duration < 240;
          });
        });
      } else if (filterType === 'images') {
        filteredPosts = filteredPosts.filter(post => {
          const images = post.post_media?.filter(m => m.media_type === 'image') || [];
          return images.length > 0;
        });
      }

      console.log('[useInfiniteBusinessPosts] 📊 RESULT:', {
        postsReturned: filteredPosts.length,
        originalCount: postsData?.length || 0
      });

      const hasMore = (postsData?.length || 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      return { 
        items: filteredPosts, 
        nextCursor, 
        hasMore 
      };
    },

    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  const allItems = query.data?.pages.flatMap(page => page.items) ?? [];

  return {
    items: allItems,
    isLoading: query.isLoading,
    hasMore: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
