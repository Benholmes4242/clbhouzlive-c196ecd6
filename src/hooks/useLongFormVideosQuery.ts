import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface UseLongFormVideosOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string;
  searchQuery?: string;
  category?: string; // Kept for compatibility, ignored
  sort?: string; // Kept for compatibility, ignored
  getBoostScore?: (creatorId: string, category?: string) => number; // Kept for compatibility, ignored
  enabled?: boolean;
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

async function fetchVideos(options: Omit<UseLongFormVideosOptions, 'enabled'>): Promise<LongFormVideo[]> {
  const { 
    section = 'all', 
    limit = 20, 
    followedCreatorIds = [], 
    creatorUserId, 
    searchQuery,
  } = options;

  // Simple query - all videos, only filter for horizontal
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

  // Only apply creator filter if specified
  if (creatorUserId) {
    query = query.eq('user_id', creatorUserId);
  }

  // Only apply search filter if specified
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('content', `%${searchQuery.trim()}%`);
  }

  // Only apply following filter for following section
  if (section === 'following' && !creatorUserId && !searchQuery) {
    if (followedCreatorIds.length > 0) {
      query = query.in('user_id', followedCreatorIds);
    } else {
      return [];
    }
  }

  // Fetch more to filter for horizontal
  const overfetch = Math.min(limit * 10, 200);
  query = query.order('created_at', { ascending: false }).limit(overfetch);

  console.log(`[useLongFormVideosQuery] 🔍 SIMPLE QUERY for ${section}`);

  const { data, error: queryError } = await query;

  console.log(`[useLongFormVideosQuery] 📊 RAW RESULT for ${section}:`, {
    videosReturned: data?.length || 0,
    error: queryError?.message,
  });

  if (queryError) throw queryError;
  if (!data || data.length === 0) return [];

  // Filter for horizontal videos only (width > height)
  const horizontalVideos = data.filter((post: any) => {
    const media = post.post_media?.[0];
    if (!media) return false;
    const width = media.width || 0;
    const height = media.height || 0;
    return width > height;
  });

  console.log(`[useLongFormVideosQuery] 🎬 After horizontal filter: ${horizontalVideos.length} of ${data.length}`);

  // Fetch profiles
  const userIds = [...new Set(horizontalVideos.map((post: any) => post.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  const videos: LongFormVideo[] = horizontalVideos.slice(0, limit).map((post: any) => {
    const media = post.post_media?.[0];
    const user = profileMap.get(post.user_id);
    const golfTag = post.post_tags?.find((tag: any) => tag.taggable_entities?.entity_type === 'golf_club');
    const views = post.post_views?.[0]?.count || 0;

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
      createdAt: post.created_at,
      golfCourseId: golfTag?.taggable_entities?.entity_id,
      golfCourseName: golfTag?.taggable_entities?.name,
      isTrending: section === 'trending',
    };
  });

  return videos;
}

/**
 * Simple query hook for videos - only filters for horizontal videos
 */
export const useLongFormVideosQuery = (options: UseLongFormVideosOptions = {}) => {
  const { 
    section = 'all', 
    limit = 20, 
    followedCreatorIds = [], 
    creatorUserId, 
    searchQuery,
    enabled = true,
  } = options;

  const queryKey = [
    'videos-simple-v2',
    section,
    limit,
    followedCreatorIds.join(','),
    creatorUserId || '',
    searchQuery || '',
  ];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchVideos({
      section,
      limit,
      followedCreatorIds,
      creatorUserId,
      searchQuery,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled,
    refetchOnWindowFocus: false,
  });

  return {
    videos: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useLongFormVideosQuery;
