import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SnapModalMedia {
  photos: string[];
  videos: string[];
}

export function useSnapModalUserMedia(userId?: string) {
  return useQuery({
    queryKey: ['snapModalMedia', userId],
    enabled: !!userId,
    staleTime: 60_000, // 1 minute
    queryFn: async (): Promise<SnapModalMedia> => {
      if (!userId) throw new Error('User ID required');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          created_at,
          post_media (
            id,
            media_type,
            media_url,
            poster_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      const photos: string[] = [];
      const videos: string[] = [];

      for (const post of data ?? []) {
        for (const media of post.post_media ?? []) {
          if (media.media_type === 'image' && media.media_url) {
            photos.push(media.media_url);
          } else if (media.media_type === 'video') {
            // For videos, use poster_url if available, otherwise media_url
            const videoThumbnail = media.poster_url || media.media_url;
            if (videoThumbnail) {
              videos.push(videoThumbnail);
            }
          }
        }
      }

      return { photos, videos };
    }
  });
}