import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLatestHorizontalVideo = (userId?: string) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestHorizontalVideo = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user's posts with video media, ordered by most recent
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
          .limit(10); // Get last 10 video posts to check aspect ratios

        if (error) {
          console.error('Error fetching videos:', error);
          setVideoUrl(null);
          return;
        }

        if (!posts || posts.length === 0) {
          setVideoUrl(null);
          return;
        }

        // Check each video for horizontal aspect ratio
        for (const post of posts) {
          const media = post.post_media?.[0];
          if (media?.media_url) {
            // Create a video element to check dimensions
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            const checkVideoRatio = new Promise<boolean>((resolve) => {
              video.onloadedmetadata = () => {
                const aspectRatio = video.videoWidth / video.videoHeight;
                const isHorizontal = aspectRatio > 1.2; // Must be significantly wider than tall
                resolve(isHorizontal);
              };
              video.onerror = () => resolve(false);
              // Timeout after 2 seconds
              setTimeout(() => resolve(false), 2000);
            });

            video.src = media.media_url;
            
            const isHorizontal = await checkVideoRatio;
            if (isHorizontal) {
              setVideoUrl(media.media_url);
              return;
            }
          }
        }

        // No horizontal videos found
        setVideoUrl(null);
      } catch (error) {
        console.error('Error in fetchLatestHorizontalVideo:', error);
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestHorizontalVideo();
  }, [userId]);

  return { videoUrl, loading };
};