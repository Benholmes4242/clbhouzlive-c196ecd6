
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoPost } from '@/components/feed/types';

export const useExternalVideos = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      
      // Only fetch real friend videos from the edge function
      // Remove any mock/example data completely
      try {
        const { data, error } = await supabase.functions.invoke('fetch-friend-videos');
        
        if (error) {
          console.error('Error fetching friend videos:', error);
          setVideos([]);
        } else {
          // Only use real friend videos, filter out any example/mock data
          const realFriendVideos = data?.videos?.filter((video: VideoPost) => 
            video.type === 'friend' && 
            video.user.username !== '@mikej_golf' && 
            video.user.username !== '@sarahgolf' &&
            !video.user.name.includes('Mike Johnson') &&
            !video.user.name.includes('Sarah Chen')
          ) || [];
          
          setVideos(realFriendVideos);
        }
      } catch (error) {
        console.error('Error calling friend videos function:', error);
        setVideos([]);
      }
      
      setLoading(false);
    };

    loadContent();
  }, []);

  return { videos, loading };
};
