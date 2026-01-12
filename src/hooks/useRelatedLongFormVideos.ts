import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';
import { LongFormVideo } from '@/components/videos/LongFormVideoTile';

interface UseRelatedLongFormVideosOptions {
  limit?: number;
  category?: string;
  creatorUserId?: string;
  courseId?: string;
}

interface UseRelatedLongFormVideosResult {
  videos: LongFormVideo[];
  upNextVideo: LongFormVideo | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch related long-form videos for the video player modal
 * 
 * Priority order (YouTube-style):
 * 1. Same creator (limit 5)
 * 2. Same video_category (limit 6)
 * 3. Trending last 7 days (limit 15)
 * 4. Popular fallback (all-time, score-sorted)
 */
export const useRelatedLongFormVideos = (
  videoId: string,
  options: UseRelatedLongFormVideosOptions = {}
): UseRelatedLongFormVideosResult => {
  const { 
    limit = 10, 
    category, 
    creatorUserId, 
    courseId 
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

  const calculateScore = (views: number, likes: number): number => {
    return (views || 0) + ((likes || 0) * 25);
  };

  const fetchRelatedVideos = useCallback(async () => {
    if (!videoId) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allVideos: LongFormVideo[] = [];
      const seenIds = new Set<string>([videoId]); // Exclude current video

      // Helper to transform post to LongFormVideo
      const transformPost = (post: any): LongFormVideo | null => {
        if (seenIds.has(post.id)) return null;
        seenIds.add(post.id);

        const media = post.post_media?.[0];
        const user = post.user_profiles;
        
        const golfTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );
        
        // Golf course: prefer tag, fallback to course_id FK
        const golfCourseId = golfTag?.taggable_entities?.entity_id || post.course_id || undefined;
        const golfCourseName = golfTag?.taggable_entities?.name || undefined;

        // Get counts from aggregated relations
        const views = post.post_views?.[0]?.count || 0;
        const likes = post.post_likes?.[0]?.count || 0;

        return {
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
          isTrending: false,
          _score: calculateScore(views, likes),
        } as LongFormVideo & { _score: number };
      };

      // Base select string for all queries (no user_profiles - fetched separately)
      const selectString = `
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
            name,
            slug
          )
        ),
        post_likes(count),
        post_views(count)
      `;

      // 1. Same creator videos (highest priority)
      if (creatorUserId) {
        const { data: creatorVideos } = await supabase
          .from('posts')
          .select(selectString)
          .eq('user_id', creatorUserId)
          .eq('post_media.media_type', 'video')
          .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
          .not('post_media.duration_seconds', 'is', null)
          .neq('id', videoId)
          .eq('status', 'published') // Only show published posts
          .order('created_at', { ascending: false })
          .limit(5);

        if (creatorVideos) {
          for (const post of creatorVideos) {
            const video = transformPost(post);
            if (video) allVideos.push(video);
          }
        }
      }

      // 2. Same category videos (if category provided) - moved up in priority
      if (category && allVideos.length < limit) {
        const { data: categoryTaggedPosts } = await supabase
          .from('post_tags')
          .select('post_id, taggable_entities!inner(entity_type, slug)')
          .eq('taggable_entities.entity_type', 'video_category')
          .eq('taggable_entities.slug', category);

        if (categoryTaggedPosts && categoryTaggedPosts.length > 0) {
          const categoryPostIds = categoryTaggedPosts.map(t => t.post_id).filter(id => !seenIds.has(id));
          
          if (categoryPostIds.length > 0) {
            const { data: categoryVideos } = await supabase
              .from('posts')
              .select(selectString)
              .in('id', categoryPostIds)
              .eq('post_media.media_type', 'video')
              .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
              .not('post_media.duration_seconds', 'is', null)
              .eq('status', 'published') // Only show published posts
              .order('created_at', { ascending: false })
              .limit(6);

            if (categoryVideos) {
              for (const post of categoryVideos) {
                const video = transformPost(post);
                if (video) allVideos.push(video);
              }
            }
          }
        }
      }

      // 3. Trending last 7 days (score-sorted)
      if (allVideos.length < limit) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: trendingVideos } = await supabase
          .from('posts')
          .select(selectString)
          .eq('post_media.media_type', 'video')
          .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
          .not('post_media.duration_seconds', 'is', null)
          .gte('created_at', sevenDaysAgo.toISOString())
          .eq('status', 'published') // Only show published posts
          .order('created_at', { ascending: false })
          .limit(15);

        if (trendingVideos) {
          for (const post of trendingVideos) {
            const video = transformPost(post);
            if (video) allVideos.push(video);
          }
        }
      }

      // 4. Popular fallback (all-time, if still need more)
      if (allVideos.length < limit) {
        const { data: popularVideos } = await supabase
          .from('posts')
          .select(selectString)
          .eq('post_media.media_type', 'video')
          .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
          .not('post_media.duration_seconds', 'is', null)
          .eq('status', 'published') // Only show published posts
          .order('created_at', { ascending: false })
          .limit(20);

        if (popularVideos) {
          for (const post of popularVideos) {
            const video = transformPost(post);
            if (video) allVideos.push(video);
          }
        }
      }

      // Fetch profiles for all collected videos
      const userIds = [...new Set(allVideos.map(v => v.creatorUserId))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        
        // Update videos with profile data
        for (const video of allVideos) {
          const profile = profileMap.get(video.creatorUserId);
          if (profile) {
            video.creatorName = profile.display_name || profile.username || 'Unknown';
            video.creatorAvatarUrl = profile.profile_photo_url;
          }
        }
      }

      // Sort by engagement score and take limit
      const sortedVideos = allVideos
        .sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0))
        .slice(0, limit)
        .map(v => {
          const { _score, ...video } = v as any;
          return video as LongFormVideo;
        });

      setVideos(sortedVideos);
    } catch (err) {
      console.error('Error fetching related videos:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch related videos'));
    } finally {
      setIsLoading(false);
    }
  }, [videoId, limit, category, creatorUserId, courseId]);

  useEffect(() => {
    fetchRelatedVideos();
  }, [fetchRelatedVideos]);

  // Up next is the first video in the list
  const upNextVideo = videos.length > 0 ? videos[0] : null;

  return {
    videos,
    upNextVideo,
    isLoading,
    error,
    refetch: fetchRelatedVideos,
  };
};

export default useRelatedLongFormVideos;
