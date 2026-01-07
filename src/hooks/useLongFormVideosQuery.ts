import { useQuery } from '@tanstack/react-query';
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

interface UseLongFormVideosOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string;
  sort?: 'latest' | 'popular';
  searchQuery?: string;
  category?: string;
  getBoostScore?: (creatorId: string, category?: string) => number;
  enabled?: boolean; // For lazy loading
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

const calculateScore = (views: number, likes: number): number => {
  return (views || 0) + ((likes || 0) * 25);
};

async function fetchLongFormVideos(options: Omit<UseLongFormVideosOptions, 'enabled'>): Promise<LongFormVideo[]> {
  const { 
    section = 'all', 
    limit = 10, 
    followedCreatorIds = [], 
    creatorUserId, 
    sort = 'latest',
    searchQuery,
    category,
    getBoostScore,
  } = options;

  // Determine if we need category or courses filtering
  const needsCategoryFilter = category && category !== 'all';
  const needsCoursesFilter = section === 'courses' && !creatorUserId && !searchQuery;

  let filteredPostIds: string[] | null = null;

  if (needsCategoryFilter) {
    const { data: taggedPosts, error: tagError } = await supabase
      .from('post_tags')
      .select(`post_id, taggable_entities!inner(entity_type, slug)`)
      .eq('taggable_entities.entity_type', 'video_category')
      .eq('taggable_entities.slug', category);

    if (tagError) throw tagError;
    filteredPostIds = taggedPosts?.map(t => t.post_id) || [];
    
    if (filteredPostIds.length === 0) return [];
  } else if (needsCoursesFilter) {
    const { data: courseTaggedPosts, error: courseTagError } = await supabase
      .from('post_tags')
      .select(`post_id, taggable_entities!inner(entity_type)`)
      .eq('taggable_entities.entity_type', 'golf_club');

    if (courseTagError) throw courseTagError;
    filteredPostIds = courseTaggedPosts?.map(t => t.post_id) || [];
    
    if (filteredPostIds.length === 0) return [];
  }

  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
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

  if (filteredPostIds !== null) {
    query = query.in('id', filteredPostIds);
  }

  if (creatorUserId) {
    query = query.eq('user_id', creatorUserId);
  }

  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('content', `%${searchQuery.trim()}%`);
  }

  if (!creatorUserId && !searchQuery) {
    switch (section) {
      case 'trending':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
        break;
        
      case 'following':
        if (followedCreatorIds.length > 0) {
          query = query.in('user_id', followedCreatorIds);
        } else {
          return [];
        }
        break;
    }
  }

  const needsScoreSort = section === 'trending' || section === 'recommended' || sort === 'popular';
  const fetchLimit = needsScoreSort ? Math.min(limit * 2, 20) : limit; // Reduced overfetch
  query = query.order('created_at', { ascending: false }).limit(fetchLimit);

  const { data, error: queryError } = await query;

  if (queryError) throw queryError;
  if (!data || data.length === 0) return [];

  // Fetch profiles separately since posts has no FK to user_profiles
  const userIds = [...new Set(data.map((post: any) => post.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', userIds);

  // Create profile map for quick lookup
  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.id, p])
  );

  type VideoWithScore = { video: LongFormVideo; score: number };
  
  const videosWithScores: VideoWithScore[] = data.map((post: any) => {
    const media = post.post_media?.[0];
    const user = profileMap.get(post.user_id);

    const golfTag = post.post_tags?.find(
      (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
    );

    // Get counts from aggregated relations
    const views = post.post_views?.[0]?.count || 0;
    const likes = post.post_likes?.[0]?.count || 0;
    const baseScore = calculateScore(views, likes);
    const boostScore = getBoostScore ? getBoostScore(post.user_id, category) : 0;
    const score = baseScore + boostScore;

    const video: LongFormVideo = {
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
      createdAt: post.created_at,
      golfCourseId: golfTag?.taggable_entities?.entity_id,
      golfCourseName: golfTag?.taggable_entities?.name,
      isTrending: section === 'trending',
    };

    return { video, score };
  });

  let sortedVideos = videosWithScores;
  if (needsScoreSort) {
    sortedVideos = [...videosWithScores].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.video.createdAt || 0).getTime() - new Date(a.video.createdAt || 0).getTime();
    });
  }

  return sortedVideos.slice(0, limit).map(v => v.video);
}

/**
 * React Query version of useLongFormVideos with caching + deduplication
 * 
 * Features:
 * - 5 min staleTime (won't refetch if data is fresh)
 * - 30 min gcTime (keeps data in cache)
 * - Query key based on all filter params
 * - enabled prop for lazy loading
 * - ENABLE_MOCK_VIDEOS flag injects 25 mock videos per section for UI testing
 */
export const useLongFormVideosQuery = (options: UseLongFormVideosOptions = {}) => {
  const { 
    section = 'all', 
    limit = 10, 
    followedCreatorIds = [], 
    creatorUserId, 
    sort = 'latest',
    searchQuery,
    category,
    getBoostScore,
    enabled = true,
  } = options;

  // Stable query key - don't include getBoostScore (function)
  const queryKey = [
    'long-form-videos-v2',
    section,
    limit,
    followedCreatorIds.join(','),
    creatorUserId || '',
    sort,
    searchQuery || '',
    category || '',
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLongFormVideos({
      section,
      limit,
      followedCreatorIds,
      creatorUserId,
      sort,
      searchQuery,
      category,
      getBoostScore,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled,
    refetchOnWindowFocus: false,
  });

  // Inject mock videos when flag is enabled (for UI testing)
  let videos = query.data || [];
  if (ENABLE_MOCK_VIDEOS && !creatorUserId && !searchQuery) {
    const mockVideos = getMockVideosForSection(section);
    // Combine real + mock, respecting limit
    videos = [...videos, ...mockVideos].slice(0, limit);
  }

  return {
    videos,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// Helper to get mock videos for a section
function getMockVideosForSection(section: string): LongFormVideo[] {
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

export default useLongFormVideosQuery;
