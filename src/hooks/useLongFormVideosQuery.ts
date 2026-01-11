import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { getMockVideosForSection } from '@/components/videos/mockVideoData';

// PRODUCTION: 4 minutes minimum for long-form videos
const VIDEO_DURATION_THRESHOLD_SECONDS = 240;

export type VideoSortOption = 'newest' | 'most-liked' | 'most-discussed';

interface UseLongFormVideosOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string;
  searchQuery?: string;
  category?: string;
  sort?: VideoSortOption;
  getBoostScore?: (creatorId: string, category?: string) => number; // Kept for compatibility
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

/**
 * Get a guaranteed thumbnail URL with fallbacks
 */
const getGuaranteedThumbnail = (media: any): string => {
  // 1. Direct poster_url
  if (media?.poster_url && media.poster_url.trim()) {
    return media.poster_url;
  }
  
  // 2. Generate from media_url (Cloudflare Stream)
  if (media?.media_url) {
    const uid = uidFromNode({ media_url: media.media_url });
    if (uid) {
      return generateStreamThumbnailUrl(uid);
    }
  }
  
  // 3. Generate from stream_id if available
  if (media?.stream_id) {
    return generateStreamThumbnailUrl(media.stream_id);
  }
  
  // 4. Fallback - empty string (component will handle fallback UI)
  return '';
};

async function fetchVideos(options: Omit<UseLongFormVideosOptions, 'enabled' | 'getBoostScore'>): Promise<LongFormVideo[]> {
  const { 
    section = 'all', 
    limit = 20, 
    followedCreatorIds = [], 
    creatorUserId, 
    searchQuery,
    category,
    sort = 'newest',
  } = options;

  // Production query with proper filters
  let query = supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      user_id,
      badges,
      course_id,
      categories,
      like_count,
      comment_count,
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
      post_views(count)
    `)
    .eq('post_media.media_type', 'video')
    .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
    .not('post_media.duration_seconds', 'is', null)
    .eq('visibility', 'anyone');

  // Only apply creator filter if specified
  if (creatorUserId) {
    query = query.eq('user_id', creatorUserId);
  }

  // Only apply search filter if specified
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('content', `%${searchQuery.trim()}%`);
  }

  // Category filter - filter by categories array
  if (category && category !== 'all') {
    query = query.contains('categories', [category]);
  }

  // Section-specific filters
  if (section === 'following' && !creatorUserId && !searchQuery) {
    if (followedCreatorIds.length > 0) {
      query = query.in('user_id', followedCreatorIds);
    } else {
      return [];
    }
  }

  // Trending: last 7 days only
  if (section === 'trending') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    query = query.gte('created_at', sevenDaysAgo.toISOString());
  }

  // Courses: filter to videos with course association
  if (section === 'courses') {
    query = query.not('course_id', 'is', null);
  }

  // Apply sorting based on section and sort option
  // Trending uses engagement sorting, others respect sort option
  if (section === 'trending') {
    // Trending always sorts by engagement (likes first, then date)
    query = query
      .order('like_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
  } else {
    // Apply user-selected sort
    switch (sort) {
      case 'most-liked':
        query = query.order('like_count', { ascending: false, nullsFirst: false });
        break;
      case 'most-discussed':
        query = query.order('comment_count', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
    }
  }

  // Reasonable overfetch (2x limit, max 50)
  const overfetch = Math.min(limit * 2, 50);
  query = query.limit(overfetch);

  console.log(`[useLongFormVideosQuery] 🔍 Query for ${section} (threshold: ${VIDEO_DURATION_THRESHOLD_SECONDS}s, sort: ${sort}, category: ${category || 'all'})`);

  const { data, error: queryError } = await query;

  console.log(`[useLongFormVideosQuery] 📊 Result for ${section}:`, {
    videosReturned: data?.length || 0,
    error: queryError?.message,
  });

  if (queryError) throw queryError;
  if (!data || data.length === 0) return [];

  // Fetch profiles
  const userIds = [...new Set(data.map((post: any) => post.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .in('id', userIds);

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

  let videos: LongFormVideo[] = data.slice(0, limit).map((post: any) => {
    const media = post.post_media?.[0];
    const user = profileMap.get(post.user_id);
    const golfTag = post.post_tags?.find((tag: any) => tag.taggable_entities?.entity_type === 'golf_club');
    const views = post.post_views?.[0]?.count || 0;
    const likes = post.like_count || post.post_likes?.[0]?.count || 0;

    return {
      id: post.id,
      title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
      creatorUserId: post.user_id,
      creatorName: user?.display_name || user?.username || 'Unknown',
      creatorAvatarUrl: user?.profile_photo_url,
      thumbnailUrl: getGuaranteedThumbnail(media),
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

  // For trending section, apply engagement scoring (in case DB sort isn't perfect)
  if (section === 'trending') {
    videos = videos.sort((a, b) => {
      // Score: likes * 3 + views / 10
      const scoreA = (a.likes || 0) * 3 + (a.views || 0) / 10;
      const scoreB = (b.likes || 0) * 3 + (b.views || 0) / 10;
      return scoreB - scoreA;
    });
  }

  // If no real videos found, inject mock data for demo purposes
  if (videos.length === 0) {
    console.log(`[useLongFormVideosQuery] No videos found for ${section}, injecting mock data`);
    return getMockVideosForSection(section as any, limit);
  }

  return videos;
}

/**
 * Production query hook for long-form videos (≥4 minutes, public visibility)
 * Supports section filtering, sorting, and category filtering.
 */
export const useLongFormVideosQuery = (options: UseLongFormVideosOptions = {}) => {
  const { 
    section = 'all', 
    limit = 20, 
    followedCreatorIds = [], 
    creatorUserId, 
    searchQuery,
    category,
    sort = 'newest',
    enabled = true,
  } = options;

  const queryKey = [
    'videos-longform-v4',
    section,
    limit,
    followedCreatorIds.join(','),
    creatorUserId || '',
    searchQuery || '',
    category || 'all',
    sort,
  ];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      return fetchVideos({
        section,
        limit,
        followedCreatorIds,
        creatorUserId,
        searchQuery,
        category,
        sort,
      });
    },
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
