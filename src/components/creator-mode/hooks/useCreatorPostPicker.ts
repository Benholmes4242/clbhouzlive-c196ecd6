import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PickerPost {
  id: string;
  thumbnailUrl: string | null;
  isVideo: boolean;
  duration: number | null;
  caption: string;
}

async function fetchPickerPosts(userId: string): Promise<PickerPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, content, created_at,
      post_media(id, media_type, media_url, poster_url, stream_id, duration_seconds, width, height, display_order)
    `)
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((post: any) => {
    const media = (post.post_media ?? []).sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
    );
    const first = media[0];
    const isVideo = first?.media_type === 'video';

    return {
      id: post.id,
      thumbnailUrl: first?.poster_url ?? first?.media_url ?? null,
      isVideo,
      duration: isVideo ? first?.duration_seconds ?? null : null,
      caption: post.content ?? '',
    };
  });
}

export function useCreatorPostPicker(userId: string | undefined) {
  return useQuery({
    queryKey: ['creator-post-picker', userId],
    queryFn: () => fetchPickerPosts(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
