import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 10;

interface UseInfiniteBusinessTaggedPostsOptions {
  businessId?: string;
  filterType?: 'all' | 'longform' | 'shorts' | 'images';
}

// Extended post type with review/course data
export interface TaggedPostWithReview {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  visibility: string;
  source_review_id: string | null;
  course_id: string | null;
  post_media: Array<{
    id: string;
    media_type: string;
    media_url: string;
    duration_seconds?: number | null;
    poster_url?: string | null;
    width?: number | null;
    height?: number | null;
    display_order?: number | null;
  }> | null;
  post_likes: Array<{ count: number }> | null;
  post_views: Array<{ count: number }> | null;
  post_comments: Array<{ count: number }> | null;
  user_profiles?: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  } | null;
  // Review data
  isReview: boolean;
  sourceReviewId: string | null;
  reviewRating: number | null;
  reviewTitle: string | null;
  // Course data
  courseName: string | null;
  courseLocation: string | null;
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    sub_country?: string;
    region?: string;
  } | null;
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

      // Step 3: Fetch posts with review/course joins (matching useCommunityFeed)
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, visibility, source_review_id, course_id,
          post_media (
            id, media_type, media_url, duration_seconds,
            poster_url, width, height, display_order
          ),
          post_likes (count),
          post_views (count),
          post_comments!post_comments_post_id_fkey (count),
          user_profiles!posts_user_id_fkey (
            id, display_name, username, profile_photo_url
          ),
          course_ratings:source_review_id (
            id,
            rating,
            title,
            review,
            course_review_media (id, media_type, media_url, duration_seconds, width, height)
          ),
          golf_courses!posts_course_id_fkey (id, name, country, sub_country, region)
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

      // Map posts to include review/course data
      const mappedPosts: TaggedPostWithReview[] = filteredPosts.map((post: any) => {
        // Review data extraction
        const courseRating = post.course_ratings;
        const isReview = !!post.source_review_id;
        const reviewRating = courseRating?.rating ?? null;
        const reviewTitle = courseRating?.title ?? null;
        
        // Course data from join
        const golfCourseData = post.golf_courses;
        const golfCourse = golfCourseData ? {
          id: golfCourseData.id,
          name: golfCourseData.name,
          country: golfCourseData.country,
          sub_country: golfCourseData.sub_country,
          region: golfCourseData.region,
        } : null;
        
        // Build course location string
        let courseLocation: string | null = null;
        if (golfCourseData) {
          const parts = [golfCourseData.region || golfCourseData.sub_country, golfCourseData.country].filter(Boolean);
          courseLocation = parts.join(', ');
        }

        // Combine post_media and review_media for reviews
        const reviewMedia = courseRating?.course_review_media || [];
        const postMedia = post.post_media || [];
        const allMedia = isReview && reviewMedia.length > 0 ? reviewMedia : postMedia;

        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user_id: post.user_id,
          visibility: post.visibility,
          source_review_id: post.source_review_id,
          course_id: post.course_id,
          post_media: allMedia.map((m: any, idx: number) => ({
            ...m,
            display_order: m.display_order ?? idx,
          })).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)),
          post_likes: post.post_likes,
          post_views: post.post_views,
          post_comments: post.post_comments,
          user_profiles: post.user_profiles,
          // Review fields
          isReview,
          sourceReviewId: post.source_review_id,
          reviewRating,
          reviewTitle,
          // Course fields
          courseName: golfCourse?.name ?? null,
          courseLocation,
          golfCourse,
        };
      });

      console.log('[useInfiniteBusinessTaggedPosts] 📊 RESULT:', {
        postsReturned: mappedPosts.length,
        originalCount: postsData?.length || 0
      });

      const hasMore = (postsData?.length || 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      return { 
        items: mappedPosts, 
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
