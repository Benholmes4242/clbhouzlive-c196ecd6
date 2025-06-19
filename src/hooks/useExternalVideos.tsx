
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoPost } from '@/components/feed/types';

export const useExternalVideos = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchYouTubeVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-videos');
      
      if (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
      }
      
      return data?.videos || [];
    } catch (error) {
      console.error('Error calling YouTube function:', error);
      return [];
    }
  };

  const fetchFriendVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-friend-videos');
      
      if (error) {
        console.error('Error fetching friend videos:', error);
        return [];
      }
      
      return data?.videos || [];
    } catch (error) {
      console.error('Error calling friend videos function:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      // Fetch YouTube and friend videos in parallel
      const [youtubeVideos, friendVideos] = await Promise.all([
        fetchYouTubeVideos(),
        fetchFriendVideos()
      ]);
      
      const allVideos = [...youtubeVideos, ...friendVideos];
      setVideos(allVideos);
      setLoading(false);
    };

    loadContent();
  }, []);

  return { videos, loading };
};
