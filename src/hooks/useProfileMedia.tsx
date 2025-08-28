import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  media_type: string;
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

      setMediaItems(data || []);
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

  // Subscribe to real-time changes with error handling
  useEffect(() => {
    if (!userId) return;

    let subscription: any = null;
    
    const setupRealtimeSubscription = async () => {
      try {
        subscription = supabase
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
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Profile media realtime subscription active');
            } else if (status === 'CLOSED') {
              console.log('Profile media realtime subscription closed');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Profile media realtime subscription error - continuing without realtime updates');
            }
          });
      } catch (error) {
        console.warn('Failed to setup realtime subscription for profile media:', error);
        // Continue without realtime updates - app still functional
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from profile media realtime:', error);
        }
      }
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