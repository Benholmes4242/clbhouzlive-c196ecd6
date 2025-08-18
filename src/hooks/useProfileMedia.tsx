import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  duration: number;
  display_order: number;
  header_extended_url?: string;
  header_strip_url?: string;
  header_metadata?: any;
  video_method?: string;
  file_name?: string;
  created_at: string;
}

export const useProfileMedia = (userId: string) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMediaItems = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profile_media')
        .select('*')
        .eq('user_id', userId)
        .eq('is_immersive', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform data to match MediaItem interface
      const transformedData: MediaItem[] = (data || []).map(item => ({
        ...item,
        media_type: (item.media_type === 'video' || item.media_type === 'image') 
          ? item.media_type as 'video' | 'image'
          : 'image' // default fallback
      }));

      setMediaItems(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile media:', err);
      setError(err.message);
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMediaItems();
  }, [userId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`profile_media_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_media',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchMediaItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const refetch = () => {
    fetchMediaItems();
  };

  return {
    mediaItems,
    loading,
    error,
    refetch
  };
};