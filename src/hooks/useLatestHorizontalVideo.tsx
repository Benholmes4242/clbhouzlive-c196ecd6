import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLatestHorizontalVideo = (userId?: string) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestVideo = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user's most recent video post
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id,
            created_at,
            post_media!inner (
              id,
              media_type,
              media_url
            )
          `)
          .eq('user_id', userId)
          .eq('post_media.media_type', 'video')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching videos:', error);
          setVideoUrl(null);
          return;
        }

        if (posts && posts.length > 0 && posts[0].post_media?.[0]?.media_url) {
          setVideoUrl(posts[0].post_media[0].media_url);
        } else {
          setVideoUrl(null);
        }
      } catch (error) {
        console.error('Error in fetchLatestVideo:', error);
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestVideo();
  }, [userId]);

  return { videoUrl, loading };
};