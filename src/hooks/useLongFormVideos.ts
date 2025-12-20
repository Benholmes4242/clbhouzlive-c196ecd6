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
 */
export const useLongFormVideos = (options: UseLongFormVideosOptions = {}): UseLongFormVideosResult => {
  const { section = 'all', limit = 10, followedCreatorIds = [], creatorUserId, sort = 'latest' } = options;
  
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

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Base query: get posts with video media that are long-form
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner(
            id,
            media_type,
            media_url,
            duration_seconds,
            poster_url
          ),
          post_tags(
            id,
            tagged_entity_id,
            taggable_entities(
              id,
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

      // If fetching for a specific creator (Creator Page)
      if (creatorUserId) {
        query = query.eq('user_id', creatorUserId);
        // Apply sort for creator page
        if (sort === 'popular') {
          query = query.order('created_at', { ascending: false }); // Fallback until we have proper popularity sorting
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        // Apply section-specific filters for Videos tab
        switch (section) {
          case 'trending':
            // Last 7 days, sorted by engagement
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query
              .gte('created_at', sevenDaysAgo.toISOString())
              .order('created_at', { ascending: false });
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
            query = query.order('created_at', { ascending: false });
            break;
            
          case 'courses':
            // Videos that have a golf course/club tag
            query = query.order('created_at', { ascending: false });
            break;
            
          case 'recommended':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }
      }

      query = query.limit(limit);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      // Transform to LongFormVideo format
      const transformedVideos: LongFormVideo[] = (data || [])
        .filter(post => {
          // For courses section, filter to posts that have golf_club entity tags
          if (section === 'courses') {
            const hasGolfTag = post.post_tags?.some(
              (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
            );
            return hasGolfTag;
          }
          return true;
        })
        .map((post: any) => {
          const media = post.post_media?.[0];
          const user = post.user_profiles;
          const stats = post.post_stats?.[0];
          
          // Find golf course tag if present
          const golfTag = post.post_tags?.find(
            (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
          );

          // Calculate if trending (for trending section)
          const isTrending = section === 'trending';

          return {
            id: post.id,
            title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
            creatorUserId: post.user_id,
            creatorName: user?.display_name || user?.username || 'Unknown',
            creatorAvatarUrl: user?.profile_photo_url,
            thumbnailUrl: media?.poster_url || '',
            duration: formatDuration(media?.duration_seconds || 0),
            durationSeconds: media?.duration_seconds || 0,
            views: stats?.views_count || 0,
            createdAt: post.created_at,
            golfCourseId: golfTag?.taggable_entities?.entity_id,
            golfCourseName: golfTag?.taggable_entities?.name,
            isTrending,
          };
        });

      setVideos(transformedVideos);
    } catch (err) {
      console.error('Error fetching long-form videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch videos'));
    } finally {
      setIsLoading(false);
    }
  }, [section, limit, followedCreatorIds, creatorUserId, sort]);

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
