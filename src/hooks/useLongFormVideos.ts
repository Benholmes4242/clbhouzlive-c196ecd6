import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface UseLongFormVideosOptions {
  section?: 'recommended' | 'trending' | 'following' | 'courses' | 'all';
  limit?: number;
  followedCreatorIds?: string[];
  creatorUserId?: string; // Filter to specific creator's videos
  sort?: 'latest' | 'popular'; // Sort order for creator page
  searchQuery?: string; // Search term for videos search
  category?: string; // Category filter slug (maps to video_category tag slug)
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
  } = options;
  
  const [videos, setVideos] = useState<LongFormVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
          post_media!inner(
            media_url,
            duration_seconds,
            poster_url
          ),
          post_tags(
            taggable_entities(
              entity_type,
              entity_id,
              name
            )
          ),
          user_profiles!posts_user_id_fkey(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_stats(
            likes_count,
            views_count
          )
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
            // Last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query.gte('created_at', sevenDaysAgo.toISOString());
            break;
            
          case 'following':
            // Only show videos from followed creators
            if (followedCreatorIds.length > 0) {
              query = query.in('user_id', followedCreatorIds);
            } else {
              // No followed creators = empty result
              setVideos([]);
              setIsLoading(false);
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

      // Transform to LongFormVideo format with score calculation
      // Use typed intermediate structure for cleaner score sorting
      type VideoWithScore = { video: LongFormVideo; score: number };
      
      const videosWithScores: VideoWithScore[] = (data || []).map((post: any) => {
        const media = post.post_media?.[0];
        const user = post.user_profiles;
        const stats = post.post_stats?.[0];
        
        // Find golf course tag if present (for display purposes)
        const golfTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );

        const views = stats?.views_count || 0;
        const likes = stats?.likes_count || 0;
        const score = calculateScore(views, likes);

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
          golfCourseId: golfTag?.taggable_entities?.entity_id,
          golfCourseName: golfTag?.taggable_entities?.name,
          isTrending: section === 'trending',
        };

        return { video, score };
      });

      // Apply score-based sorting for trending and popular sections
      let sortedVideos = videosWithScores;
      if (section === 'trending' || sort === 'popular') {
        // Sort by engagement score descending, tie-break by created_at descending
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
      setIsLoading(false);
    }
  }, [section, limit, followedCreatorIds, creatorUserId, sort, searchQuery, category]);

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
