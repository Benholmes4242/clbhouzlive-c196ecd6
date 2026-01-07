import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

const PAGE_SIZE = 10;

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

interface LongFormVideosPage {
  items: LongFormVideo[];
  nextCursor: number;
  hasMore: boolean;
}

interface UseInfiniteLongFormVideosOptions {
  section: SectionType;
  followedCreatorIds?: string[];
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
 * Simple infinite scroll hook - only filters for horizontal videos
 */
export function useInfiniteLongFormVideos(options: UseInfiniteLongFormVideosOptions) {
  const { section, followedCreatorIds = [] } = options;

  const query = useInfiniteQuery({
    queryKey: ['videos-infinite-simple', section, followedCreatorIds.join(',')],
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<LongFormVideosPage> => {
      const startRange = pageParam as number;
      // Fetch 3x PAGE_SIZE to ensure we get enough horizontal videos after filtering
      const fetchSize = PAGE_SIZE * 3;
      const endRange = startRange + fetchSize - 1;

      console.log('[useInfiniteLongFormVideos] 🔍 FETCHING PAGE:', {
        section,
        pageParam,
        startRange,
        endRange,
      });

      // For 'following' section, return empty if no followed creators
      if (section === 'following' && followedCreatorIds.length === 0) {
        return { items: [], nextCursor: startRange, hasMore: false };
      }

      // Simple query - all videos
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
        .eq('post_media.media_type', 'video');

      // Only apply following filter for following section
      if (section === 'following') {
        baseQuery = baseQuery.in('user_id', followedCreatorIds);
      }

      baseQuery = baseQuery
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      const { data: postsData, error } = await baseQuery;

      console.log('[useInfiniteLongFormVideos] 📊 RAW QUERY RESULT:', {
        section,
        postsReturned: postsData?.length || 0,
        error: error?.message,
      });

      if (error) throw error;

      // Filter for horizontal videos only (width > height)
      const horizontalVideos = (postsData || []).filter((post: any) => {
        const media = post.post_media?.[0];
        if (!media) return false;
        const width = media.width || 0;
        const height = media.height || 0;
        return width > height;
      });

      console.log(`[useInfiniteLongFormVideos] 🎬 After horizontal filter: ${horizontalVideos.length}`);

      // Take only PAGE_SIZE items
      const pageVideos = horizontalVideos.slice(0, PAGE_SIZE);

      // Fetch profiles for creators
      const userIds = [...new Set(pageVideos.map((p: any) => p.user_id).filter(Boolean))] as string[];
      
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Transform to LongFormVideo format
      const items: LongFormVideo[] = pageVideos.map((post: any) => {
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

      // hasMore based on whether we found enough horizontal videos
      const hasMore = horizontalVideos.length >= PAGE_SIZE;
      const nextCursor = hasMore ? startRange + fetchSize : startRange;

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
