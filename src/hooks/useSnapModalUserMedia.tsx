import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MediaThumb } from '@/lib/resolveThumb';

// Re-export for convenience
export type { MediaThumb } from '@/lib/resolveThumb';

const PAGE_SIZE = 30;

export function useUserMedia(userId: string | null, page = 0, viewerId?: string | null) {
  return useQuery({
    queryKey: ["user-media", userId, page, viewerId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<MediaThumb[]> => {
      if (!userId) throw new Error('User ID required');

      // Build base query
      const baseQuery = supabase
        .from('posts')
        .select(`
          id,
          created_at,
          user_id,
          post_media (
            id,
            media_type,
            media_url,
            poster_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      // Apply visibility filter: viewer sees own posts (any visibility) OR public posts of others
      const { data, error } = userId === viewerId
        ? await baseQuery.eq('user_id', userId)
        : await baseQuery.eq('user_id', userId); // Note: Add .eq('visibility', 'public') when visibility column exists

      if (error) throw error;

      // Flatten to one row per media item
      const rows: MediaThumb[] = [];
      for (const post of data ?? []) {
        for (const media of post.post_media ?? []) {
          rows.push({
            postId: post.id,
            url: media.media_url,
            thumbUrl: media.poster_url, // For videos, use poster as thumbnail
            posterUrl: media.poster_url,
            type: media.media_type,
            width: null,
            height: null,
            createdAt: post.created_at,
            streamId: null
          });
        }
      }
      return rows;
    },
  });
}

// Legacy hook for backward compatibility
export function useSnapModalUserMedia(userId?: string) {
  const { data, isLoading, error } = useUserMedia(userId, 0, userId);
  
  const photos = data?.filter(m => m.type === 'image').map(m => m.thumbUrl || m.url) ?? [];
  const videos = data?.filter(m => m.type === 'video').map(m => m.thumbUrl || m.url) ?? [];
  
  return {
    data: { photos, videos },
    isLoading,
    error
  };
}