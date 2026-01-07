import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';
import { ENABLE_MOCK_VIDEOS } from '@/lib/featureFlags';
import { 
  MOCK_RECOMMENDED_VIDEOS, 
  MOCK_TRENDING_VIDEOS, 
  MOCK_FOLLOWING_VIDEOS, 
  MOCK_COURSES_VIDEOS 
} from '@/mocks/mockLongFormVideos';

const PAGE_SIZE = 10;  // Load 10 videos per page for faster loads

type SectionType = 'recommended' | 'trending' | 'following' | 'courses';

interface LongFormVideosPage {
  items: LongFormVideo[];
  nextCursor: number;
  hasMore: boolean;
}

interface UseInfiniteLongFormVideosOptions {
  section: SectionType;
  followedCreatorIds?: string[];
  category?: string;
}

// Helper to get mock videos for a section
function getMockVideosForSection(section: SectionType): LongFormVideo[] {
  switch (section) {
    case 'recommended':
      return MOCK_RECOMMENDED_VIDEOS;
    case 'trending':
      return MOCK_TRENDING_VIDEOS;
    case 'following':
      return MOCK_FOLLOWING_VIDEOS;
    case 'courses':
      return MOCK_COURSES_VIDEOS;
    default:
      return MOCK_RECOMMENDED_VIDEOS;
  }
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
 * Infinite scroll hook for long-form videos (≥4 minutes)
 * Used by VideosSectionPage for "View All" pages
 */
export function useInfiniteLongFormVideos(options: UseInfiniteLongFormVideosOptions) {
  const { section, followedCreatorIds = [], category } = options;

  const query = useInfiniteQuery({
    queryKey: ['long-form-videos-infinite', section, followedCreatorIds.join(','), category || ''],
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<LongFormVideosPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      // For 'following' section, return empty if no followed creators
      if (section === 'following' && followedCreatorIds.length === 0) {
        return { items: [], nextCursor: startRange, hasMore: false };
      }

      // For 'courses' section, first get post IDs with golf_club tags
      let coursePostIds: string[] | null = null;
      if (section === 'courses') {
        const { data: courseTaggedPosts, error: courseTagError } = await supabase
          .from('post_tags')
          .select(`post_id, taggable_entities!inner(entity_type)`)
          .eq('taggable_entities.entity_type', 'golf_club');

        if (courseTagError) throw courseTagError;
        coursePostIds = courseTaggedPosts?.map(t => t.post_id) || [];
        
        if (coursePostIds.length === 0) {
          return { items: [], nextCursor: startRange, hasMore: false };
        }
      }

      // Base query - videos ≥4 minutes
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
            filter_id,
            studio_edits
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
        .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
        .not('post_media.duration_seconds', 'is', null);

      // Apply section-specific filters
      if (section === 'trending') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        baseQuery = baseQuery.gte('created_at', sevenDaysAgo.toISOString());
      } else if (section === 'following') {
        baseQuery = baseQuery.in('user_id', followedCreatorIds);
      } else if (section === 'courses' && coursePostIds) {
        baseQuery = baseQuery.in('id', coursePostIds);
      }

      // Apply category filter if provided
      if (category && category !== 'all') {
        const { data: categoryPosts } = await supabase
          .from('post_tags')
          .select(`post_id, taggable_entities!inner(entity_type, slug)`)
          .eq('taggable_entities.entity_type', 'video_category')
          .eq('taggable_entities.slug', category);
        
        if (categoryPosts && categoryPosts.length > 0) {
          const categoryPostIds = categoryPosts.map(t => t.post_id);
          baseQuery = baseQuery.in('id', categoryPostIds);
        }
      }

      // Order and paginate
      baseQuery = baseQuery
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      const { data: postsData, error } = await baseQuery;

      if (error) throw error;

      // Fetch profiles for creators
      const userIds = [...new Set(postsData?.map(p => p.user_id).filter(Boolean))] as string[];
      
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

      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });

  const realItems = query.data?.pages.flatMap((page) => page.items) ?? [];
  const pagesLoaded = query.data?.pages.length ?? 0;
  
  // Inject mock videos when flag is enabled (for UI testing)
  // Apply same pagination logic - only show PAGE_SIZE * pagesLoaded mocks
  let allItems = realItems;
  let mockHasMore = false;
  
  if (ENABLE_MOCK_VIDEOS) {
    const mockVideos = getMockVideosForSection(section);
    // De-dupe by id
    const seenIds = new Set(realItems.map(v => v.id));
    const uniqueMocks = mockVideos.filter(v => !seenIds.has(v.id));
    
    // Paginate mocks the same way - only show up to PAGE_SIZE * pagesLoaded
    const maxMocksToShow = Math.max(0, (PAGE_SIZE * pagesLoaded) - realItems.length);
    const paginatedMocks = uniqueMocks.slice(0, maxMocksToShow);
    
    allItems = [...realItems, ...paginatedMocks];
    mockHasMore = paginatedMocks.length < uniqueMocks.length;
  }
  
  // Has more if real data has more OR mocks have more to show
  const hasMore = ENABLE_MOCK_VIDEOS 
    ? (query.hasNextPage ?? false) || mockHasMore
    : (query.hasNextPage ?? false);

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export default useInfiniteLongFormVideos;
