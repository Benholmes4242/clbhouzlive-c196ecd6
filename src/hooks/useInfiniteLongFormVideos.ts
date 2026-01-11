import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

const PAGE_SIZE = 10;

// PRODUCTION: 4 minutes minimum for long-form videos
const VIDEO_DURATION_THRESHOLD_SECONDS = 240;

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

interface LongFormVideosPage {
  items: LongFormVideo[];
  nextCursor: number;
  hasMore: boolean;
}

interface UseInfiniteLongFormVideosOptions {
  section: SectionType;
  followedCreatorIds?: string[];
  creatorUserId?: string; // Filter to specific creator
  minDuration?: number; // Minimum duration in seconds (default 240)
  category?: string; // Kept for compatibility, ignored
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
 * Production infinite scroll hook for long-form videos (≥4 minutes, public visibility)
 */
export function useInfiniteLongFormVideos(options: UseInfiniteLongFormVideosOptions) {
  const { 
    section, 
    followedCreatorIds = [],
    creatorUserId,
    minDuration = VIDEO_DURATION_THRESHOLD_SECONDS,
  } = options;

  const query = useInfiniteQuery({
    queryKey: ['videos-infinite-longform-v3', section, followedCreatorIds.join(','), creatorUserId || '', minDuration],
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
      });

      // For 'following' section, return empty if no followed creators
      if (section === 'following' && followedCreatorIds.length === 0) {
        return { items: [], nextCursor: startRange, hasMore: false };
      }

      // Production query with proper filters
      let baseQuery = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          course_id,
          badges,
          post_media!inner(
            media_url,
            duration_seconds,
            poster_url,
            width,
            height
          ),
          post_tags(
            taggable_entities(
              entity_type,
              entity_id,
              name
            )
          ),
          post_likes(count),
          post_views(count)
        `)
        .eq('post_media.media_type', 'video')
        .gte('post_media.duration_seconds', minDuration)
        .not('post_media.duration_seconds', 'is', null)
        .eq('visibility', 'anyone');

      // Filter by specific creator if provided
      if (creatorUserId) {
        baseQuery = baseQuery.eq('user_id', creatorUserId);
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

      baseQuery = baseQuery
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

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
      const items: LongFormVideo[] = (postsData || []).map((post: any) => {
        const media = post.post_media?.[0];
        const user = profileMap.get(post.user_id);
        
        const golfTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        const views = post.post_views?.[0]?.count || 0;
        const likes = post.post_likes?.[0]?.count || 0;

        return {
          id: post.id,
          title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
          creatorUserId: post.user_id,
          creatorName: user?.display_name || user?.username || 'Unknown',
          creatorAvatarUrl: user?.profile_photo_url,
          thumbnailUrl: media?.poster_url || '',
          mediaUrl: media?.media_url || undefined,
          duration: formatDuration(media?.duration_seconds || 0),
          durationSeconds: media?.duration_seconds || 0,
          views,
          likes,
          createdAt: post.created_at,
          golfCourseId: golfTag?.taggable_entities?.entity_id || post.course_id,
          golfCourseName: golfTag?.taggable_entities?.name,
          isTrending: section === 'trending',
        };
      });

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
