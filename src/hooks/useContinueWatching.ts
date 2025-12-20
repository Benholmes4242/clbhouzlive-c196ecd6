import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface ContinueWatchingVideo extends LongFormVideo {
  progressPercent: number;
  lastPositionSeconds: number;
}

interface UseContinueWatchingResult {
  videos: ContinueWatchingVideo[];
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to fetch videos user has partially watched (Continue Watching)
 * 
 * Query rules:
 * - Only for logged-in users
 * - Only long-form videos (≥3 min)
 * - Only videos with progress > 0 (not completed)
 * - Ordered by most recently watched
 */
export const useContinueWatching = (limit: number = 10): UseContinueWatchingResult => {
  const { session } = useSupabaseSession();
  const userId = session?.user?.id;

  const [videos, setVideos] = useState<ContinueWatchingVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const fetchContinueWatching = useCallback(async () => {
    if (!userId) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch progress records with video data
      const { data, error } = await supabase
        .from('video_progress')
        .select(`
          post_id,
          last_position_seconds,
          duration_seconds,
          updated_at,
          posts!inner(
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
          )
        `)
        .eq('user_id', userId)
        .gt('last_position_seconds', 10) // Only show videos with meaningful progress (>10s per spec)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching continue watching:', error);
        setVideos([]);
        return;
      }

      // Transform to ContinueWatchingVideo format
      const transformedVideos: ContinueWatchingVideo[] = (data || [])
        .filter((item: any) => {
          // Enforce long-form rule
          const mediaDuration = item.posts?.post_media?.[0]?.duration_seconds;
          return mediaDuration && mediaDuration >= VIDEO_DURATION_THRESHOLD_SECONDS;
        })
        .filter((item: any) => {
          // Only show if not near the end (< duration - 10s)
          const mediaDuration = item.posts?.post_media?.[0]?.duration_seconds;
          return mediaDuration && item.last_position_seconds < mediaDuration - 10;
        })
        .map((item: any) => {
          const post = item.posts;
          const media = post?.post_media?.[0];
          const user = post?.user_profiles;
          const stats = post?.post_stats?.[0];
          const mediaDuration = media?.duration_seconds || 0;

          const progressPercent = mediaDuration > 0 
            ? Math.min(100, Math.round((item.last_position_seconds / mediaDuration) * 100))
            : 0;

          return {
            id: post.id,
            title: post.content?.split('\n')[0]?.substring(0, 100) || 'Untitled Video',
            creatorUserId: post.user_id,
            creatorName: user?.display_name || user?.username || 'Unknown',
            creatorAvatarUrl: user?.profile_photo_url,
            thumbnailUrl: media?.poster_url || '',
            duration: formatDuration(mediaDuration),
            durationSeconds: mediaDuration,
            views: stats?.views_count || 0,
            createdAt: post.created_at,
            progressPercent,
            lastPositionSeconds: item.last_position_seconds,
          };
        });

      setVideos(transformedVideos);
    } catch (err) {
      console.error('Error in fetchContinueWatching:', err);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchContinueWatching();
  }, [fetchContinueWatching]);

  return {
    videos,
    isLoading,
    refetch: fetchContinueWatching,
  };
};

export default useContinueWatching;
