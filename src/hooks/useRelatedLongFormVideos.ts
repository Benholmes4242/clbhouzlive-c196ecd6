import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VIDEO_DURATION_THRESHOLD_SECONDS } from '@/constants/videoRules';

interface RelatedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  hlsUrl: string;
  creatorName: string;
  creatorAvatarUrl: string;
  durationSeconds: number;
  duration: string;
  viewCount: number;
  views?: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface UseRelatedLongFormVideosOptions {
  creatorId?: string;
  creatorUserId?: string;
  courseId?: string;
  category?: string;
  limit?: number;
}

export function useRelatedLongFormVideos(
  videoId: string,
  options: UseRelatedLongFormVideosOptions = {}
) {
  const { limit = 10 } = options;

  const { data, isLoading } = useQuery({
    queryKey: ['related-long-form-videos', videoId, options],
    queryFn: async () => {
      if (!videoId) return [];

      const { data: related, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          created_at,
          post_media!inner(
            media_url,
            poster_url,
            stream_id,
            duration_seconds,
            media_type
          ),
          user_profiles!inner(
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .eq('post_media.media_type', 'video')
        .gte('post_media.duration_seconds', VIDEO_DURATION_THRESHOLD_SECONDS)
        .neq('id', videoId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !related) return [];

      return related.map((post: any) => {
        const media = post.post_media?.[0];
        const profile = post.user_profiles;
        const dur = media?.duration_seconds || 0;
        return {
          id: post.id,
          title: post.content?.slice(0, 100) || 'Untitled',
          thumbnailUrl: media?.poster_url || '',
          hlsUrl: media?.stream_id
            ? `https://customer-${media.stream_id}.cloudflarestream.com/${media.stream_id}/manifest/video.m3u8`
            : media?.media_url || '',
          creatorName: profile?.display_name || profile?.username || 'Unknown',
          creatorAvatarUrl: profile?.avatar_url || '',
          durationSeconds: dur,
          duration: formatDuration(dur),
          viewCount: 0,
          views: 0,
        } as RelatedVideo;
      });
    },
    enabled: !!videoId,
    staleTime: 5 * 60 * 1000,
  });

  const videos = data || [];
  const upNextVideo = videos.length > 0 ? videos[0] : null;

  return { videos, upNextVideo, isLoading };
}
