import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

// ⚠️ TESTING ONLY - Set to false for production
// When true, ignores 7-day recency filter and shows ALL landscape videos in Trending
const TESTING_MODE_FILL_TRENDING = true;

interface UseLongFormVideosOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string; // Filter to specific creator's videos
  sort?: 'latest' | 'popular'; // Sort order for creator page
  searchQuery?: string; // Search term for videos search
  category?: string; // Category filter slug (maps to video_category tag slug)
  // Optional boost function for personalized ranking (Phase 7D discovery signals)
  getBoostScore?: (creatorId: string, category?: string) => number;
}

interface UseLongFormVideosResult {
  videos: LongFormVideo[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch long-form videos (≥3 minutes) for the Videos tab
 * 
 * DATA RULES:
 * - media_type = 'video'
 * - duration_seconds >= 180
 * - duration_seconds IS NOT NULL
 * 
 * SCORING:
 * - engagement_score = views_count + (likes_count * 25)
 * - Trending: last 7 days, order by score desc
 * - Popular: order by score desc (all-time or last 30 days)
 * 
 * SERVER-SIDE FILTERING:
 * - Category filtering via post_tags -> taggable_entities (entity_type='video_category', slug=category)
 * - Search filtering via posts.content ilike
 * - Courses section filtering via post_tags -> taggable_entities (entity_type='golf_club')
 */
export const useLongFormVideos = (options: UseLongFormVideosOptions = {}): UseLongFormVideosResult => {
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
  
  const [videos, setVideos] = useState<LongFormVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchInProgress = useRef(false);
  
  // Stabilize followedCreatorIds to prevent infinite re-renders
  const followedIdsKey = useMemo(() => followedCreatorIds.sort().join(','), [followedCreatorIds]);
  const stableFollowedIds = useRef(followedCreatorIds);
  if (followedIdsKey !== stableFollowedIds.current.sort().join(',')) {
    stableFollowedIds.current = followedCreatorIds;
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

  // Calculate engagement score for ranking
  const calculateScore = (views: number, likes: number): number => {
    return (views || 0) + ((likes || 0) * 25);
  };

  const fetchVideos = useCallback(async () => {
    // Prevent duplicate concurrent fetches
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Determine if we need category or courses filtering (requires subquery approach)
      const needsCategoryFilter = category && category !== 'all';
      const needsCoursesFilter = section === 'courses' && !creatorUserId && !searchQuery;

      // If category or courses filter is needed, get matching post IDs first
      let filteredPostIds: string[] | null = null;

      if (needsCategoryFilter) {
        // Get post IDs that have the matching video_category tag
        const { data: taggedPosts, error: tagError } = await supabase
          .from('post_tags')
          .select(`
            post_id,
            taggable_entities!inner(entity_type, slug)
          `)
          .eq('taggable_entities.entity_type', 'video_category')
          .eq('taggable_entities.slug', category);

        if (tagError) throw tagError;
        filteredPostIds = taggedPosts?.map(t => t.post_id) || [];
        
        // If no posts match the category, return empty
        if (filteredPostIds.length === 0) {
          setVideos([]);
          setIsLoading(false);
          fetchInProgress.current = false;
          return;
        }
      } else if (needsCoursesFilter) {
        // Get post IDs that have a golf_club tag
        const { data: courseTaggedPosts, error: courseTagError } = await supabase
          .from('post_tags')
          .select(`
            post_id,
            taggable_entities!inner(entity_type)
          `)
          .eq('taggable_entities.entity_type', 'golf_club');

        if (courseTagError) throw courseTagError;
        filteredPostIds = courseTaggedPosts?.map(t => t.post_id) || [];
        
        if (filteredPostIds.length === 0) {
          setVideos([]);
          setIsLoading(false);
          fetchInProgress.current = false;
          return;
        }
      }

      // Base query: get posts with video media that are long-form
      // Select only fields needed by tiles
      let query = supabase
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

      // Apply category/courses filter if we have filtered post IDs
      if (filteredPostIds !== null) {
        query = query.in('id', filteredPostIds);
      }

      // If fetching for a specific creator (Creator Page)
      if (creatorUserId) {
        query = query.eq('user_id', creatorUserId);
      }

      // Apply search filter server-side
      if (searchQuery && searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery.trim()}%`);
      }

      // Apply section-specific filters for Videos tab (only if not creator-specific)
      if (!creatorUserId && !searchQuery) {
        switch (section) {
          case 'trending':
            // TESTING MODE: Skip recency filter to get all videos
            if (TESTING_MODE_FILL_TRENDING) {
              console.log('[Trending] 🧪 TESTING MODE: Showing ALL videos (no 7-day filter)');
            } else {
              // NORMAL MODE: Last 7 days
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              query = query.gte('created_at', sevenDaysAgo.toISOString());
              console.log('[Trending] Using normal 7-day filter');
            }
            break;
            
          case 'following':
            // Only show videos from followed creators
            if (stableFollowedIds.current.length > 0) {
              query = query.in('user_id', stableFollowedIds.current);
            } else {
              // No followed creators = empty result
              setVideos([]);
              setIsLoading(false);
              fetchInProgress.current = false;
              return;
            }
            break;
        }
      }

      // Apply base ordering (we'll re-sort by score client-side for trending/popular)
      // Only over-fetch when score sorting is needed
      const needsScoreSort = section === 'trending' || sort === 'popular';
      const fetchLimit = needsScoreSort ? limit * 3 : limit;
      query = query.order('created_at', { ascending: false }).limit(fetchLimit);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      if (!data || data.length === 0) {
        setVideos([]);
        setIsLoading(false);
        fetchInProgress.current = false;
        return;
      }

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

      // Transform to LongFormVideo format with score calculation
      // Use typed intermediate structure for cleaner score sorting
      type VideoWithScore = { video: LongFormVideo; score: number };
      
      const videosWithScores: VideoWithScore[] = data.map((post: any) => {
        const media = post.post_media?.[0];
        const user = profileMap.get(post.user_id);
        
        // Find golf course tag if present (for display purposes)
        const golfTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );
        
        // Golf course: prefer tag, fallback to course_id FK
        const golfCourseId = golfTag?.taggable_entities?.entity_id || post.course_id || undefined;
        const golfCourseName = golfTag?.taggable_entities?.name || undefined;

        // Get counts from aggregated relations
        const views = post.post_views?.[0]?.count || 0;
        const likes = post.post_likes?.[0]?.count || 0;
        // Base engagement score + optional discovery boost for personalization
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
          duration: formatDuration(media?.duration_seconds || 0),
          durationSeconds: media?.duration_seconds || 0,
          views,
          createdAt: post.created_at,
          golfCourseId,
          golfCourseName,
          isTrending: section === 'trending',
        };

        return { video, score };
      });

      // Apply score-based sorting for trending, popular, and recommended (with boost) sections
      let sortedVideos = videosWithScores;
      const needsScoreSorting = section === 'trending' || section === 'recommended' || sort === 'popular';
      if (needsScoreSorting) {
        // Sort by score descending, tie-break by created_at descending
        sortedVideos = [...videosWithScores].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          // Tie-break by created_at
          return new Date(b.video.createdAt || 0).getTime() - new Date(a.video.createdAt || 0).getTime();
        });
      }

      // Trim to requested limit and extract videos
      const finalVideos = sortedVideos.slice(0, limit).map(v => v.video);

      setVideos(finalVideos);
    } catch (err) {
      console.error('Error fetching long-form videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch videos'));
    } finally {
      fetchInProgress.current = false;
      setIsLoading(false);
    }
  }, [section, limit, followedIdsKey, creatorUserId, sort, searchQuery, category]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    isLoading,
    error,
    refetch: fetchVideos,
  };
};

export default useLongFormVideos;
