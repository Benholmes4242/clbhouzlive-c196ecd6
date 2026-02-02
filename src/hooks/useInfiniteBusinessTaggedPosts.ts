import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 10;

interface UseInfiniteBusinessTaggedPostsOptions {
  businessId?: string;
  filterType?: 'all' | 'longform' | 'shorts' | 'images';
}

export function useInfiniteBusinessTaggedPosts(options: UseInfiniteBusinessTaggedPostsOptions) {
  const { businessId, filterType = 'all' } = options;

  const query = useInfiniteQuery({
    queryKey: ['business-tagged-posts-infinite', businessId, filterType],
    initialPageParam: 0,
    enabled: !!businessId,
    
    queryFn: async ({ pageParam = 0 }) => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      if (!businessId) {
        return { items: [], nextCursor: 0, hasMore: false };
      }

      console.log('[useInfiniteBusinessTaggedPosts] 🔍 QUERY:', {
        businessId,
        filterType,
        startRange,
        endRange
      });

      // Step 1: Get taggable entity ID for this business
      const taggableResult = await supabase
        .from('taggable_entities')
        .select('id')
        .eq('entity_type', 'business')
        .eq('entity_id', businessId)
        .maybeSingle();

      const taggableEntity = taggableResult.data as { id: string } | null;

      if (!taggableEntity) {
        console.log('[useInfiniteBusinessTaggedPosts] No taggable entity found');
        return { items: [], nextCursor: 0, hasMore: false };
      }

      // Step 2: Get post IDs that tag this business
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('post_id')
        .eq('tagged_entity_id', taggableEntity.id);

      const postIds = postTags?.map(pt => pt.post_id) || [];

      if (postIds.length === 0) {
        console.log('[useInfiniteBusinessTaggedPosts] No tagged posts found');
        return { items: [], nextCursor: 0, hasMore: false };
      }

      // Step 3: Fetch posts with pagination using RPC or simpler query
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, visibility,
          post_media (
            id, media_type, media_url, duration_seconds,
            poster_url, width, height
          ),
          post_likes (count),
          post_views (count),
          post_comments!post_comments_post_id_fkey (count)
        `)
        .in('id', postIds as string[])
        .eq('visibility', 'anyone')
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) {
        console.error('[useInfiniteBusinessTaggedPosts] ❌ Error:', error);
        throw error;
      }

      // Client-side filtering for media type
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

      console.log('[useInfiniteBusinessTaggedPosts] 📊 RESULT:', {
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
