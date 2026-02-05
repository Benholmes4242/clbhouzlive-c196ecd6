import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

const PAGE_SIZE = 10;

// PRODUCTION: 4 minutes minimum for long-form videos
const VIDEO_DURATION_THRESHOLD_SECONDS = 240;

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';
export type VideoSortOption = 'newest' | 'most-liked' | 'most-discussed';

interface LongFormVideosPage {
  items: LongFormVideo[];
  nextCursor: number;
  hasMore: boolean;
}

interface UseInfiniteLongFormVideosOptions {
  section: SectionType;
  followedCreatorIds?: string[];
  creatorUserId?: string;    // Filter by user_id (personal posts)
  minDuration?: number;
  category?: string;
  sort?: VideoSortOption;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get a guaranteed thumbnail URL with fallbacks
 */
const getGuaranteedThumbnail = (media: any): string => {
  if (media?.poster_url && media.poster_url.trim()) {
    return media.poster_url;
  }
  if (media?.media_url) {
    const uid = uidFromNode({ media_url: media.media_url });
    if (uid) {
      return generateStreamThumbnailUrl(uid);
    }
  }
  if (media?.stream_id) {
    return generateStreamThumbnailUrl(media.stream_id);
  }
  return '';
};

/**
 * Production infinite scroll hook for long-form videos (≥4 minutes, public visibility)
 * Supports section filtering, sorting, and category filtering.
 */
export function useInfiniteLongFormVideos(options: UseInfiniteLongFormVideosOptions) {
  const { 
    section, 
    followedCreatorIds = [],
    creatorUserId,
    minDuration = VIDEO_DURATION_THRESHOLD_SECONDS,
    category,
    sort = 'newest',
  } = options;

  const query = useInfiniteQuery({
    queryKey: ['videos-infinite-longform-v6', section, followedCreatorIds.join(','), creatorUserId || '', minDuration, category || 'all', sort],
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<LongFormVideosPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      console.log('[useInfiniteLongFormVideos] 🔍 FETCHING PAGE:', {
        section,
        pageParam,
        startRange,
        endRange,
        threshold: VIDEO_DURATION_THRESHOLD_SECONDS,
        category,
        sort,
      });

      // For 'following' section, return empty if no followed creators
      if (section === 'following' && followedCreatorIds.length === 0) {
        return { items: [], nextCursor: startRange, hasMore: false };
      }

      // Production query with proper filters
      // Use 'any' type assertion to avoid deep type instantiation error
      let baseQuery: any = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          course_id,
          badges,
          categories,
          like_count,
          comment_count,
          source_review_id,
          post_media!inner(
            media_url,
            duration_seconds,
            poster_url,
            width,
            height,
            stream_id
          ),
          post_tags(
            taggable_entities(
              entity_type,
              entity_id,
              name
            )
          ),
          post_likes(count),
          post_views(count),
          course_ratings(
            id,
            overall_rating,
            golf_courses(
              id,
              name,
              country,
              region,
              sub_country
            )
          ),
          golf_courses(
            id,
            name,
            country,
            region,
            sub_country
          )
        `)
        .eq('post_media.media_type', 'video')
        .gte('post_media.duration_seconds', minDuration)
        .not('post_media.duration_seconds', 'is', null)
        .eq('visibility', 'anyone')
        .eq('status', 'published');

      // Filter by user_id for personal posts
      if (creatorUserId) {
        baseQuery = baseQuery.eq('user_id', creatorUserId);
      }

      // Category filter
      if (category && category !== 'all') {
        baseQuery = baseQuery.contains('categories', [category]);
      }

      // Section-specific filters
      if (section === 'following' && !creatorUserId) {
        baseQuery = baseQuery.in('user_id', followedCreatorIds);
      }

      // Trending: last 7 days only
      if (section === 'trending') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        baseQuery = baseQuery.gte('created_at', sevenDaysAgo.toISOString());
      }

      // Courses: filter to videos with course association
      if (section === 'courses') {
        baseQuery = baseQuery.not('course_id', 'is', null);
      }

      // Apply sorting
      if (section === 'trending') {
        // Trending uses engagement sorting
        baseQuery = baseQuery
          .order('like_count', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
      } else {
        switch (sort) {
          case 'most-liked':
            baseQuery = baseQuery.order('like_count', { ascending: false, nullsFirst: false });
            break;
          case 'most-discussed':
            baseQuery = baseQuery.order('comment_count', { ascending: false, nullsFirst: false });
            break;
          case 'newest':
          default:
            baseQuery = baseQuery.order('created_at', { ascending: false });
        }
      }

      baseQuery = baseQuery.range(startRange, endRange);

      const { data: postsData, error } = await baseQuery;

      console.log('[useInfiniteLongFormVideos] 📊 QUERY RESULT:', {
        section,
        postsReturned: postsData?.length || 0,
        error: error?.message,
      });

      if (error) throw error;

      // Fetch profiles for creators
      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id).filter(Boolean))] as string[];
      
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Transform to LongFormVideo format
      let items: LongFormVideo[] = (postsData || []).map((post: any) => {
        const media = post.post_media?.[0];
        const user = profileMap.get(post.user_id);
        
        const golfTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        const views = post.post_views?.[0]?.count || 0;
        const likes = post.like_count || post.post_likes?.[0]?.count || 0;

        // Detect review posts - has source_review_id OR has course_ratings entry
        const isReview = !!(post.source_review_id || (post.course_ratings && post.course_ratings.length > 0));
        const reviewRating = post.course_ratings?.[0]?.overall_rating ?? null;

        // Get golf course info - from course_ratings, direct relation, or tag
        let golfCourse = null;
        if (post.course_ratings?.[0]?.golf_courses) {
          const gc = post.course_ratings[0].golf_courses;
          golfCourse = {
            id: gc.id,
            name: gc.name,
            country: gc.country,
            region: gc.region,
            sub_country: gc.sub_country,
          };
        } else if (post.golf_courses) {
          golfCourse = {
            id: post.golf_courses.id,
            name: post.golf_courses.name,
            country: post.golf_courses.country,
            region: post.golf_courses.region,
            sub_country: post.golf_courses.sub_country,
          };
        } else if (golfTag?.taggable_entities) {
          golfCourse = {
            id: golfTag.taggable_entities.entity_id,
            name: golfTag.taggable_entities.name,
            country: null,
            region: null,
            sub_country: null,
          };
        }

        return {
          id: post.id,
          title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          content: post.content,
          creatorUserId: post.user_id,
          creatorName: user?.display_name || user?.username || 'Unknown',
          creatorAvatarUrl: user?.profile_photo_url,
          thumbnailUrl: getGuaranteedThumbnail(media),
          mediaUrl: media?.media_url || undefined,
          mediaWidth: media?.width || null,
          mediaHeight: media?.height || null,
          duration: formatDuration(media?.duration_seconds || 0),
          durationSeconds: media?.duration_seconds || 0,
          views,
          likes,
          createdAt: post.created_at,
          golfCourseId: golfCourse?.id || golfTag?.taggable_entities?.entity_id || post.course_id,
          golfCourseName: golfCourse?.name || golfTag?.taggable_entities?.name,
          golfCourse,
          isReview,
          reviewRating,
          isTrending: section === 'trending',
        };
      });

      // For trending, apply client-side engagement scoring
      if (section === 'trending') {
        items = items.sort((a, b) => {
          const scoreA = (a.likes || 0) * 3 + (a.views || 0) / 10;
          const scoreB = (b.likes || 0) * 3 + (b.views || 0) / 10;
          return scoreB - scoreA;
        });
      }

      // hasMore based on PAGE_SIZE
      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      console.log('[useInfiniteLongFormVideos] ✅ PAGE COMPLETE:', {
        section,
        itemsReturned: items.length,
        hasMore,
        nextCursor
      });

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const allItems = query.data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export default useInfiniteLongFormVideos;
