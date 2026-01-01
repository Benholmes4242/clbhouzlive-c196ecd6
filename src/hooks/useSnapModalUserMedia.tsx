import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

type MediaRow = {
  id: string;
  type: "image" | "video";
  url: string;        // media_url
  thumbUrl?: string;  // poster_url or generated
};

export type MediaThumb = {
  postId: string;
  url: string;
  thumbUrl?: string | null;
  type: string;      // "image" | "video"
  width?: number | null;
  height?: number | null;
  createdAt: string;
  visibility?: "public" | "private";
};

function getStreamThumb(url?: string): string | undefined {
  if (!url) return undefined;
  // Expecting Stream manifest like:
  // https://customer-XXXX.cloudflarestream.com/<VIDEO_ID>/manifest/video.m3u8
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const videoId = parts[1]; // ["<customer>", "<VIDEO_ID>", "manifest", "video.m3u8"]
    if (!videoId) return undefined;
    // Cloudflare Stream static poster:
    // https://customer-XXXX.cloudflarestream.com/<VIDEO_ID>/thumbnails/thumbnail.jpg
    return url.replace(/\/manifest\/.*$/, `/thumbnails/thumbnail.jpg`);
  } catch {
    return undefined;
  }
}

const PAGE_SIZE = 30;

export function useUserMedia(userId: string | null, page = 0, viewerId?: string | null) {
  return useQuery({
    queryKey: ["user-media", userId, page, viewerId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async (): Promise<MediaRow[]> => {
      if (!userId) throw new Error('User ID required');

      // Build base query
      const baseQuery = supabase
        .from('posts')
        .select(`
          id,
          created_at,
          user_id,
          badges,
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

      // Flatten to one row per media item and apply proper thumbnail logic
      const rows: MediaRow[] = [];
      for (const post of data ?? []) {
        for (const media of post.post_media ?? []) {
          const isVideo = media.media_type === "video";
          const thumb = media.poster_url || (isVideo ? getStreamThumb(media.media_url) : undefined);
          
          rows.push({
            id: media.id,
            type: isVideo ? "video" : "image",
            url: media.media_url,
            thumbUrl: thumb,
          });
        }
      }
      return rows;
    },
  });
}

// Updated hook with stable, memoized arrays
export function useSnapModalUserMedia(userId?: string) {
  const { data, isLoading, error } = useUserMedia(userId, 0, userId);
  
  // Split + memoize derived arrays so refs are stable
  const { photos, videos } = useMemo(() => {
    const arr = data ?? [];
    return {
      photos: arr.filter((m) => m.type === "image"),
      videos: arr.filter((m) => m.type === "video"),
    };
  }, [data]);

  return { photos, videos, isLoading, error };
}