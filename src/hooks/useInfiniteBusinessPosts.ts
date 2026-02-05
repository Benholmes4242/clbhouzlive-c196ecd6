import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 10;

interface UseInfiniteBusinessPostsOptions {
  businessId?: string;
  filterType?: 'all' | 'longform' | 'shorts' | 'images';
}

// Extended post type with review/course data
export interface BusinessPostWithReview {
  id: string;
  content: string | null;
  created_at: string;
  actor_id: string;
  actor_type: string;
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

      // Build base query with review and course joins (matching useCommunityFeed)
      let baseQuery = supabase
        .from('posts')
        .select(`
          id, content, created_at, actor_id, actor_type, user_id, visibility, source_review_id, course_id,
          post_media (
            id, media_type, media_url, duration_seconds,
            poster_url, width, height, display_order
          ),
          post_likes (count),
          post_views (count),
          post_comments!post_comments_post_id_fkey (count),
          course_ratings:source_review_id (
            id,
            rating,
            title,
            review,
            course_review_media (id, media_type, media_url, duration_seconds, width, height)
          ),
          golf_courses!posts_course_id_fkey (id, name, country, sub_country, region)
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

      // Map posts to include review/course data (matching useCommunityFeed pattern)
      const mappedPosts: BusinessPostWithReview[] = filteredPosts.map((post: any) => {
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
          actor_id: post.actor_id,
          actor_type: post.actor_type,
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

      console.log('[useInfiniteBusinessPosts] 📊 RESULT:', {
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
