import { supabase } from '@/integrations/supabase/client';

interface ShortPreview {
  posterUrl?: string;
  mp4Url?: string;
}

/**
 * Batch fetch the latest short preview (poster + video URL) for multiple creators
 * Returns a map of creator ID to preview data
 */
export async function getLatestShortPreviewForCreators(
  creatorIds: string[]
): Promise<Record<string, ShortPreview>> {
  if (!creatorIds.length) return {};

  try {
    // Fetch latest posts with media for each creator
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        user_id,
        post_media (
          media_type,
          media_url,
          poster_url,
          stream_id
        )
      `)
      .in('user_id', creatorIds)
      .order('created_at', { ascending: false });

    if (!posts) return {};

    // Build preview map - one preview per creator (their latest)
    const previewMap: Record<string, ShortPreview> = {};
    
    for (const post of posts) {
      // Skip if we already have a preview for this creator
      if (previewMap[post.user_id]) continue;
      
      // Find video media
      const media = (post.post_media as any)?.[0];
      if (!media) continue;
      
      if (media.media_type === 'video') {
        previewMap[post.user_id] = {
          posterUrl: media.poster_url || undefined,
          mp4Url: media.media_url || undefined
        };
      }
    }

    return previewMap;
  } catch (error) {
    console.error('Error fetching short previews:', error);
    return {};
  }
}
